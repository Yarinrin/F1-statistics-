import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MIN_TITLE_SIZE, fitTitleSize } from '../src/theme/fitTitle.ts';
import { TYPE } from '../src/theme/tokens.ts';

const MAX = TYPE.display.fontSize;

/** Gutter-to-gutter width on the phone sizes the app actually ships to. */
const W_320 = 320 - 44;
const W_390 = 390 - 44;
const W_430 = 430 - 44;

/** Every title the app can put on a state screen. */
const TITLES = [
  'Not in\nthe archive',
  'No\nconstructors',
  'Connection\nlost',
  'Page\nunavailable',
  'Reader\nstopped',
  'Nothing\nfiled here',
];

function longestWord(title) {
  return title.split(/\s+/).reduce((max, word) => Math.max(max, word.length), 0);
}

test('short titles keep the full display size', () => {
  assert.equal(fitTitleSize('Nothing\nfiled here', W_390, MAX), TYPE.display.fontSize);
  assert.equal(fitTitleSize('Reader\nstopped', W_390, MAX), TYPE.display.fontSize);
});

test('long words are stepped down instead of breaking', () => {
  const size = fitTitleSize('No\nconstructors', W_390, MAX);
  assert.ok(size < TYPE.display.fontSize, `expected a reduction, got ${size}`);
  assert.ok(size >= MIN_TITLE_SIZE);
});

test('every state title fits on every phone width', () => {
  for (const width of [W_320, W_390, W_430]) {
    for (const title of TITLES) {
      const size = fitTitleSize(title, width, MAX);
      const widest = longestWord(title) * size * 0.68;
      assert.ok(
        widest <= width + 1,
        `"${title.replace('\n', ' ')}" at ${size}pt needs ${Math.round(widest)}px of ${width}px`,
      );
    }
  }
});

test('the size never collapses to nothing', () => {
  assert.equal(fitTitleSize('Supercalifragilisticexpialidocious', 40, MAX), MIN_TITLE_SIZE);
  assert.equal(fitTitleSize('', W_390, MAX), TYPE.display.fontSize);
  assert.equal(fitTitleSize('Anything', 0, MAX), TYPE.display.fontSize);
});
