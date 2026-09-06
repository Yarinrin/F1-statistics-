import assert from 'node:assert/strict';
import { test } from 'node:test';

import { SECTIONS } from '../src/domain/wikipedia.ts';
import { buildSectionScript } from '../src/components/sectionScript.ts';

/**
 * The injected script is the part of the app that cannot be exercised by a
 * typecheck, so it is run here against a stand-in for Wikipedia's mobile DOM:
 * headings inside collapsed sections, an id on the heading, and a page that
 * might not be the season article at all.
 */

/* ------------------------------ DOM stand-in ------------------------------ */

function makeElement({ tag = 'h2', text = '', id = '', classes = [] } = {}) {
  const element = {
    tagName: tag.toUpperCase(),
    textContent: text,
    id,
    parentElement: null,
    previousElementSibling: null,
    children: [],
    clicks: 0,
    top: 0,
    classList: {
      _set: new Set(classes),
      contains(name) {
        return this._set.has(name);
      },
      add(name) {
        this._set.add(name);
      },
    },
    click() {
      this.clicks += 1;
      // Minerva marks an expanded section, and its block, as open.
      this.classList.add('open-block');
      if (this.block) this.block.classList.add('open-block');
    },
    getBoundingClientRect() {
      return { top: this.top };
    },
    closest(selector) {
      const wanted = selector.split(',').map((part) => part.trim().replace(/^\./, ''));
      let node = element;
      while (node) {
        if (wanted.some((name) => node.classList.contains(name))) return node;
        node = node.parentElement;
      }
      return null;
    },
  };
  return element;
}

function makeDom({ pathname, headings }) {
  const body = makeElement({ tag: 'body' });
  const all = [];

  for (const spec of headings) {
    const heading = makeElement(spec);
    // Each heading lives inside a collapsible block whose own heading toggles it.
    const block = makeElement({ tag: 'section', classes: ['collapsible-block'] });
    const toggle = makeElement({
      tag: 'h2',
      text: spec.owner ?? spec.text,
      classes: ['collapsible-heading'],
    });
    toggle.block = block;
    block.previousElementSibling = toggle;
    heading.parentElement = block;
    block.parentElement = body;
    toggle.parentElement = body;
    heading.top = spec.top ?? 800;
    heading.toggle = toggle;
    all.push(heading);
  }

  const scrolls = [];
  const messages = [];

  const document = {
    body,
    documentElement: { scrollTop: 0 },
    getElementById(id) {
      return all.find((element) => element.id === id) ?? null;
    },
    querySelectorAll(selector) {
      const tags = selector
        .split(',')
        .map((part) => part.trim().toUpperCase())
        .filter((part) => !part.startsWith('.'));
      return all.filter((element) => tags.includes(element.tagName));
    },
  };

  const window = {
    location: { pathname },
    pageYOffset: 0,
    scrollTo: (_x, y) => scrolls.push(y),
    ReactNativeWebView: {
      postMessage: (raw) => messages.push(JSON.parse(raw)),
    },
  };

  return { window, document, headings: all, scrolls, messages };
}

async function run(script, dom) {
  // The script is written for a browser; hand it its globals as parameters.
  const fn = new Function('window', 'document', 'setTimeout', 'decodeURIComponent', script);
  fn(dom.window, dom.document, setTimeout, decodeURIComponent);
  // Long enough for the retry ladder (4 attempts, 320ms apart) to finish.
  await new Promise((resolve) => setTimeout(resolve, 1700));
  return dom.messages;
}

const MODERN_HEADINGS = [
  { tag: 'h2', text: 'Entries', id: 'Entries', top: 200 },
  { tag: 'h2', text: 'Race calendar', id: 'Race_calendar', top: 400 },
  { tag: 'h2', text: 'Results and standings', id: 'Results_and_standings', top: 900 },
  { tag: 'h3', text: 'Grands Prix', id: 'Grands_Prix', top: 1000, owner: 'Results and standings' },
  {
    tag: 'h3',
    text: "World Drivers' Championship standings",
    id: "World_Drivers'_Championship_standings",
    top: 1400,
    owner: 'Results and standings',
  },
  {
    tag: 'h3',
    text: "World Constructors' Championship standings",
    id: "World_Constructors'_Championship_standings",
    top: 1900,
    owner: 'Results and standings',
  },
];

const ARTICLE = '2026_Formula_One_World_Championship';
const PATH = `/wiki/${ARTICLE}`;

/* --------------------------------- tests ---------------------------------- */

test('the generated script is valid JavaScript for every section', () => {
  for (const section of Object.values(SECTIONS)) {
    const script = buildSectionScript({
      anchor: section.fallbackAnchor,
      patterns: section.headingPatterns,
      articleTitle: ARTICLE,
    });
    assert.doesNotThrow(
      () => new Function(script),
      `${section.id} produced a script that will not parse`,
    );
  }
});

test("an apostrophe in the anchor survives being embedded in the script", () => {
  const script = buildSectionScript({
    anchor: "World_Drivers'_Championship_standings",
    patterns: SECTIONS.drivers.headingPatterns,
    articleTitle: ARTICLE,
  });
  assert.doesNotThrow(() => new Function(script));
  assert.ok(script.includes("World_Drivers'_Championship_standings"));
});

test('a known anchor expands its section and scrolls to it', async () => {
  const dom = makeDom({ pathname: PATH, headings: MODERN_HEADINGS });
  const messages = await run(
    buildSectionScript({
      anchor: "World_Drivers'_Championship_standings",
      patterns: SECTIONS.drivers.headingPatterns,
      articleTitle: ARTICLE,
    }),
    dom,
  );

  assert.equal(messages.length, 1);
  assert.equal(messages[0].status, 'found');
  assert.equal(messages[0].label, "World Drivers' Championship standings");
  assert.ok(dom.scrolls.length > 0, 'expected the page to be scrolled');
  assert.equal(dom.scrolls[0], 1400 - 12);

  const target = dom.headings.find((heading) =>
    heading.textContent.startsWith("World Drivers'"),
  );
  assert.ok(target.toggle.clicks > 0, 'expected the collapsed section to be expanded');
  const untouched = dom.headings.find((heading) => heading.textContent === 'Entries');
  assert.equal(untouched.toggle.clicks, 0, 'unrelated sections should be left alone');
});

test('a wrong anchor still finds the heading by its text', async () => {
  const dom = makeDom({ pathname: PATH, headings: MODERN_HEADINGS });
  const messages = await run(
    buildSectionScript({
      anchor: 'World_Drivers_Championship_standings_2019_renamed',
      patterns: SECTIONS.drivers.headingPatterns,
      articleTitle: ARTICLE,
    }),
    dom,
  );
  assert.equal(messages[0].status, 'found');
  assert.equal(messages[0].label, "World Drivers' Championship standings");
});

test('constructors resolves to the constructors table, not the drivers one', async () => {
  const dom = makeDom({ pathname: PATH, headings: MODERN_HEADINGS });
  const messages = await run(
    buildSectionScript({
      anchor: null,
      patterns: SECTIONS.constructors.headingPatterns,
      articleTitle: ARTICLE,
    }),
    dom,
  );
  assert.equal(messages[0].status, 'found');
  assert.equal(messages[0].label, "World Constructors' Championship standings");
  assert.equal(dom.scrolls[0], 1900 - 12);
});

test('"final standings" headings from older seasons are matched', async () => {
  const dom = makeDom({
    pathname: '/wiki/1988_Formula_One_World_Championship',
    headings: [
      { tag: 'h2', text: 'Results and standings', id: 'Results_and_standings', top: 500 },
      {
        tag: 'h3',
        text: "World Drivers' Championship final standings",
        id: "World_Drivers'_Championship_final_standings",
        top: 700,
      },
    ],
  });
  const messages = await run(
    buildSectionScript({
      // The built-in anchor is the modern one and will not exist here.
      anchor: SECTIONS.drivers.fallbackAnchor,
      patterns: SECTIONS.drivers.headingPatterns,
      articleTitle: '1988_Formula_One_World_Championship',
    }),
    dom,
  );
  assert.equal(messages[0].status, 'found');
  assert.equal(messages[0].label, "World Drivers' Championship final standings");
});

test('a season with no constructors table reports missing instead of guessing', async () => {
  const dom = makeDom({
    pathname: '/wiki/1954_Formula_One_World_Championship',
    headings: [
      { tag: 'h2', text: 'Results', id: 'Results', top: 400 },
      {
        tag: 'h3',
        text: "World Drivers' Championship final standings",
        id: "World_Drivers'_Championship_final_standings",
        top: 600,
      },
    ],
  });
  const messages = await run(
    buildSectionScript({
      anchor: SECTIONS.constructors.fallbackAnchor,
      patterns: SECTIONS.constructors.headingPatterns,
      articleTitle: '1954_Formula_One_World_Championship',
    }),
    dom,
  );
  assert.equal(messages[0].status, 'missing');
  assert.equal(dom.scrolls.length, 0, 'nothing should be scrolled to');
});

test('following a link away from the season article stops the script', async () => {
  const dom = makeDom({
    pathname: '/wiki/Max_Verstappen',
    headings: MODERN_HEADINGS,
  });
  const messages = await run(
    buildSectionScript({
      anchor: "World_Drivers'_Championship_standings",
      patterns: SECTIONS.drivers.headingPatterns,
      articleTitle: ARTICLE,
    }),
    dom,
  );
  assert.equal(messages[0].status, 'offpage');
  assert.equal(dom.scrolls.length, 0, 'the reader must not hijack another page');
});

test('the whole-article section reports the top and scrolls nothing', async () => {
  const dom = makeDom({ pathname: PATH, headings: MODERN_HEADINGS });
  const messages = await run(
    buildSectionScript({
      anchor: null,
      patterns: SECTIONS.season.headingPatterns,
      articleTitle: ARTICLE,
    }),
    dom,
  );
  assert.equal(messages[0].status, 'top');
  assert.equal(dom.scrolls.length, 0);
});

test('a percent-encoded pathname is still recognised as the season article', async () => {
  const dom = makeDom({
    pathname: '/wiki/2026_Formula_One_World_Championship',
    headings: MODERN_HEADINGS,
  });
  dom.window.location.pathname = encodeURI('/wiki/2026_Formula_One_World_Championship');
  const messages = await run(
    buildSectionScript({
      anchor: "World_Drivers'_Championship_standings",
      patterns: SECTIONS.drivers.headingPatterns,
      articleTitle: ARTICLE,
    }),
    dom,
  );
  assert.equal(messages[0].status, 'found');
});
