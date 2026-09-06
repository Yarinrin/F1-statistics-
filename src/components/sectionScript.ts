export type SectionStatus = 'found' | 'missing' | 'top' | 'offpage' | 'error';

export interface SectionScriptOptions {
  anchor: string | null;
  patterns: string[][];
  articleTitle: string;
}

/**
 * Script injected into the Wikipedia page to expand and scroll to a section.
 *
 * Three deliberate properties:
 *  - it never navigates, so it can only ever change scroll position;
 *  - it bails out unless the page really is the season article, so following a
 *    link inside Wikipedia does not yank the reader back to a standings table;
 *  - it reports what happened, so the reader can tell the truth about whether
 *    the section was found.
 */
export function buildSectionScript({ anchor, patterns, articleTitle }: SectionScriptOptions): string {
  const ANCHOR = JSON.stringify(anchor ?? null);
  const PATTERNS = JSON.stringify(patterns ?? []);
  const TITLE = JSON.stringify(articleTitle);

  return `(function () {
  var ANCHOR = ${ANCHOR};
  var PATTERNS = ${PATTERNS};
  var TITLE = ${TITLE};

  function send(payload) {
    try { window.ReactNativeWebView.postMessage(JSON.stringify(payload)); } catch (e) {}
  }

  try {
    var path = window.location.pathname || '';
    try { path = decodeURIComponent(path); } catch (e) {}
    if (path.indexOf(TITLE) === -1) { send({ type: 'section', status: 'offpage' }); return; }
    if (!PATTERNS.length && !ANCHOR) { send({ type: 'section', status: 'top' }); return; }

    function norm(value) {
      return String(value == null ? '' : value)
        .toLowerCase()
        .replace(/[\\u2018\\u2019'\`]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
    }

    function byAnchor() {
      if (!ANCHOR) return null;
      var el = document.getElementById(ANCHOR);
      if (el) return el;
      try { el = document.getElementById(decodeURIComponent(ANCHOR)); } catch (e) { el = null; }
      return el || null;
    }

    function byText() {
      var nodes = document.querySelectorAll('h1, h2, h3, h4, .mw-headline');
      for (var p = 0; p < PATTERNS.length; p++) {
        var want = PATTERNS[p];
        for (var i = 0; i < nodes.length; i++) {
          var tokens = norm(nodes[i].textContent).split(' ');
          if (!tokens.length) continue;
          var ok = true;
          for (var k = 0; k < want.length; k++) {
            if (tokens.indexOf(want[k]) === -1) { ok = false; break; }
          }
          if (ok) return nodes[i];
        }
      }
      return null;
    }

    function expand(el) {
      var node = el;
      var guard = 0;
      while (node && node !== document.body && guard < 14) {
        guard++;
        var list = node.classList;
        if (list) {
          if (list.contains('collapsible-heading') && !list.contains('open-block') && node.click) {
            node.click();
          } else if (list.contains('collapsible-block') && !list.contains('open-block')) {
            var head = node.previousElementSibling;
            if (head && head.click) head.click();
          }
        }
        node = node.parentElement;
      }
      var owner = el.closest ? el.closest('.collapsible-heading, .section-heading') : null;
      if (owner && owner.classList && !owner.classList.contains('open-block') && owner.click) {
        owner.click();
      }
    }

    function scrollToElement(el) {
      var top = el.getBoundingClientRect().top;
      var offset = window.pageYOffset || document.documentElement.scrollTop || 0;
      var y = top + offset - 12;
      window.scrollTo(0, y < 0 ? 0 : y);
    }

    var attempts = 0;
    function run() {
      attempts++;
      var el = byAnchor() || byText();
      if (!el) {
        if (attempts < 4) { setTimeout(run, 320); return; }
        send({ type: 'section', status: 'missing' });
        return;
      }
      expand(el);
      setTimeout(function () {
        scrollToElement(el);
        setTimeout(function () { scrollToElement(el); }, 220);
        send({
          type: 'section',
          status: 'found',
          label: String(el.textContent || '').trim().slice(0, 80)
        });
      }, 140);
    }

    run();
  } catch (e) {
    send({ type: 'section', status: 'error' });
  }
})();
true;`;
}
