import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  SECTIONS,
  headingTokens,
  isArchiveSection,
  matchSectionAnchor,
  normaliseAnchor,
  parseArchiveSection,
  readSectionIndex,
  resolveSection,
  seasonArticleTitle,
  seasonArticleUrl,
  seasonShareUrl,
  sectionsApiUrl,
} from '../src/domain/wikipedia.ts';

/* ------------------------------- addresses -------------------------------- */

test('article titles match Wikipedia naming for every era', () => {
  assert.equal(seasonArticleTitle(2026), '2026_Formula_One_World_Championship');
  assert.equal(seasonArticleTitle(1950), '1950_Formula_One_World_Championship');
});

test('article URLs point at the season page on both hosts', () => {
  assert.equal(
    seasonArticleUrl(2026),
    'https://en.wikipedia.org/wiki/2026_Formula_One_World_Championship',
  );
  assert.equal(
    seasonArticleUrl(2026, { mobile: true }),
    'https://en.m.wikipedia.org/wiki/2026_Formula_One_World_Championship',
  );
});

test('anchors are appended verbatim, and a stray hash is tolerated', () => {
  assert.equal(
    seasonArticleUrl(2026, { anchor: "World_Drivers'_Championship_standings" }),
    "https://en.wikipedia.org/wiki/2026_Formula_One_World_Championship#World_Drivers'_Championship_standings",
  );
  assert.equal(
    seasonArticleUrl(2026, { anchor: '#Grands_Prix' }),
    'https://en.wikipedia.org/wiki/2026_Formula_One_World_Championship#Grands_Prix',
  );
});

test('a missing anchor still yields the season page, never a broken link', () => {
  for (const anchor of [null, undefined, '', '   ', '#']) {
    assert.equal(
      seasonArticleUrl(1954, { anchor }),
      'https://en.wikipedia.org/wiki/1954_Formula_One_World_Championship',
      `anchor ${JSON.stringify(anchor)} should degrade to the page`,
    );
  }
});

test('share links are the canonical desktop address', () => {
  assert.ok(seasonShareUrl(1988).startsWith('https://en.wikipedia.org/wiki/'));
  assert.ok(seasonShareUrl(1988, 'Grands_Prix').endsWith('#Grands_Prix'));
});

test('the sections API request is well formed', () => {
  const url = new URL(sectionsApiUrl(2026));
  assert.equal(url.origin, 'https://en.wikipedia.org');
  assert.equal(url.pathname, '/w/api.php');
  assert.equal(url.searchParams.get('action'), 'parse');
  assert.equal(url.searchParams.get('prop'), 'sections');
  assert.equal(url.searchParams.get('page'), '2026_Formula_One_World_Championship');
  assert.equal(url.searchParams.get('redirects'), '1');
  // Needed so the same lookup works from the web build.
  assert.equal(url.searchParams.get('origin'), '*');
});

test('normaliseAnchor rejects nothing useful and repairs whitespace', () => {
  assert.equal(normaliseAnchor('  Grands_Prix '), 'Grands_Prix');
  assert.equal(normaliseAnchor('Grands Prix'), 'Grands_Prix');
  assert.equal(normaliseAnchor(null), null);
  assert.equal(normaliseAnchor('#'), null);
});

/* ------------------------------- section ids ------------------------------ */

test('section identifiers are validated, not trusted', () => {
  assert.equal(isArchiveSection('drivers'), true);
  assert.equal(isArchiveSection('constructors'), true);
  assert.equal(isArchiveSection('podiums'), false);
  assert.equal(parseArchiveSection('races'), 'races');
  assert.equal(parseArchiveSection(['season']), 'season');
  assert.equal(parseArchiveSection('nonsense'), null);
  assert.equal(parseArchiveSection(undefined), null);
});

/* --------------------------- heading normalising -------------------------- */

test('heading tokens ignore punctuation, markup and apostrophe style', () => {
  assert.deepEqual(headingTokens("World Drivers' Championship standings"), [
    'world',
    'drivers',
    'championship',
    'standings',
  ]);
  assert.deepEqual(headingTokens('World Drivers’ Championship standings'), [
    'world',
    'drivers',
    'championship',
    'standings',
  ]);
  assert.deepEqual(headingTokens('<i>Grands Prix</i>'), ['grands', 'prix']);
  assert.deepEqual(headingTokens('   '), []);
});

/* ---------------------------- section matching ---------------------------- */

// A modern season article (2020s layout).
const MODERN = [
  { toclevel: 1, line: 'Entries', anchor: 'Entries' },
  { toclevel: 1, line: 'Race calendar', anchor: 'Race_calendar' },
  { toclevel: 1, line: 'Regulation changes', anchor: 'Regulation_changes' },
  { toclevel: 1, line: 'Season report', anchor: 'Season_report' },
  { toclevel: 1, line: 'Results and standings', anchor: 'Results_and_standings' },
  { toclevel: 2, line: 'Grands Prix', anchor: 'Grands_Prix' },
  {
    toclevel: 2,
    line: "World Drivers' Championship standings",
    anchor: "World_Drivers'_Championship_standings",
  },
  {
    toclevel: 2,
    line: "World Constructors' Championship standings",
    anchor: "World_Constructors'_Championship_standings",
  },
];

// A completed season, where Wikipedia says "final standings".
const FINAL_STANDINGS = [
  { toclevel: 1, line: 'Results and standings', anchor: 'Results_and_standings' },
  { toclevel: 2, line: 'Grands Prix', anchor: 'Grands_Prix' },
  {
    toclevel: 2,
    line: "World Drivers' Championship final standings",
    anchor: "World_Drivers'_Championship_final_standings",
  },
  {
    toclevel: 2,
    line: "World Constructors' Championship final standings",
    anchor: "World_Constructors'_Championship_final_standings",
  },
];

// A 1950s article: no constructors' title yet, and a plainer results heading.
const EARLY = [
  { toclevel: 1, line: 'Season summary', anchor: 'Season_summary' },
  { toclevel: 1, line: 'Results', anchor: 'Results' },
  { toclevel: 2, line: 'Grands Prix', anchor: 'Grands_Prix' },
  {
    toclevel: 2,
    line: "World Drivers' Championship final standings",
    anchor: "World_Drivers'_Championship_final_standings",
  },
];

test('modern layout resolves both championships', () => {
  assert.equal(
    matchSectionAnchor(MODERN, 'drivers').anchor,
    "World_Drivers'_Championship_standings",
  );
  assert.equal(
    matchSectionAnchor(MODERN, 'constructors').anchor,
    "World_Constructors'_Championship_standings",
  );
  assert.equal(matchSectionAnchor(MODERN, 'races').anchor, 'Grands_Prix');
});

test('"final standings" headings still match', () => {
  assert.equal(
    matchSectionAnchor(FINAL_STANDINGS, 'drivers').anchor,
    "World_Drivers'_Championship_final_standings",
  );
  assert.equal(
    matchSectionAnchor(FINAL_STANDINGS, 'constructors').anchor,
    "World_Constructors'_Championship_final_standings",
  );
});

test('drivers never resolve to the constructors table, or the reverse', () => {
  for (const index of [MODERN, FINAL_STANDINGS, EARLY]) {
    const drivers = matchSectionAnchor(index, 'drivers');
    if (drivers) assert.ok(!drivers.anchor.includes('Constructors'));
    const constructors = matchSectionAnchor(index, 'constructors');
    if (constructors) assert.ok(!constructors.anchor.includes('Drivers'));
  }
});

test('a season without a constructors section resolves to nothing, not to something else', () => {
  assert.equal(matchSectionAnchor(EARLY, 'constructors'), null);
  assert.equal(
    matchSectionAnchor(EARLY, 'drivers').anchor,
    "World_Drivers'_Championship_final_standings",
  );
});

test('the whole-article section has no anchor by design', () => {
  assert.equal(matchSectionAnchor(MODERN, 'season'), null);
  assert.equal(SECTIONS.season.fallbackAnchor, null);
});

test('matching survives junk in the index', () => {
  const noisy = [
    null,
    { line: 'No anchor here', anchor: '' },
    { anchor: 'Missing_line' },
    ...MODERN,
  ];
  assert.equal(
    matchSectionAnchor(noisy, 'drivers').anchor,
    "World_Drivers'_Championship_standings",
  );
});

test('matched headings come back with markup stripped', () => {
  const withMarkup = [
    { toclevel: 2, line: "World Drivers' <i>Championship</i> standings", anchor: 'A' },
  ];
  assert.equal(matchSectionAnchor(withMarkup, 'drivers').line, "World Drivers' Championship standings");
});

/* ---------------------------- payload parsing ----------------------------- */

test('the API payload is read defensively', () => {
  assert.deepEqual(readSectionIndex({ parse: { sections: [] } }), []);
  assert.equal(readSectionIndex(null), null);
  assert.equal(readSectionIndex({}), null);
  assert.equal(readSectionIndex({ parse: {} }), null);
  assert.equal(readSectionIndex({ error: { code: 'missingtitle' } }), null);
  assert.equal(readSectionIndex('not json'), null);
  assert.deepEqual(readSectionIndex({ parse: { sections: [{ line: 'A', anchor: 'A' }] } }), [
    { line: 'A', anchor: 'A', toclevel: undefined },
  ]);
});

/* ------------------------------ live lookup ------------------------------- */

const ok = (payload) => async () => ({ ok: true, status: 200, json: async () => payload });

test('a successful lookup returns the live anchor', async () => {
  const result = await resolveSection(2026, 'drivers', {
    fetchImpl: ok({ parse: { sections: MODERN } }),
  });
  assert.equal(result.source, 'index');
  assert.equal(result.anchor, "World_Drivers'_Championship_standings");
  assert.equal(result.line, "World Drivers' Championship standings");
});

test('every failure mode degrades to the built-in anchor rather than throwing', async () => {
  const failures = {
    'network error': async () => {
      throw new Error('offline');
    },
    'http 404': async () => ({ ok: false, status: 404, json: async () => ({}) }),
    'malformed json': async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('unexpected token');
      },
    }),
    'api error payload': ok({ error: { code: 'missingtitle' } }),
    'no matching section': ok({ parse: { sections: [{ line: 'Entries', anchor: 'Entries' }] } }),
  };

  for (const [name, fetchImpl] of Object.entries(failures)) {
    const result = await resolveSection(2026, 'drivers', { fetchImpl });
    assert.equal(result.source, 'fallback', `${name} should fall back`);
    assert.equal(result.anchor, "World_Drivers'_Championship_standings", name);
  }
});

test('a hanging request is abandoned and falls back', async () => {
  const hang = (_url, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    });
  const result = await resolveSection(2026, 'constructors', { fetchImpl: hang, timeoutMs: 30 });
  assert.equal(result.source, 'fallback');
  assert.equal(result.anchor, "World_Constructors'_Championship_standings");
});

test('a runtime with no fetch at all is survivable', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = undefined;
  try {
    const result = await resolveSection(2026, 'races', {});
    assert.equal(result.source, 'fallback');
    assert.equal(result.anchor, 'Grands_Prix');
  } finally {
    globalThis.fetch = original;
  }
});

test('the whole-article section short-circuits without a request', async () => {
  let called = false;
  const result = await resolveSection(2026, 'season', {
    fetchImpl: async () => {
      called = true;
      return ok({})();
    },
  });
  assert.equal(called, false);
  assert.equal(result.anchor, null);
  assert.equal(result.source, 'none');
});
