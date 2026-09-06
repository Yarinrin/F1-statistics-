import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MAX_RECENT, sanitiseRecents, withRecent } from '../src/domain/recents.ts';

const CURRENT = 2026;
const entry = (year, section, at = 0) => ({ year, section, at });

test('a fresh install reads as an empty list', () => {
  assert.deepEqual(sanitiseRecents(null, CURRENT), []);
  assert.deepEqual(sanitiseRecents(undefined, CURRENT), []);
  assert.deepEqual(sanitiseRecents('[]', CURRENT), []);
  assert.deepEqual(sanitiseRecents({}, CURRENT), []);
  assert.deepEqual(sanitiseRecents([], CURRENT), []);
});

test('entries that no longer make sense are dropped, not repaired', () => {
  const stored = [
    entry(2026, 'drivers', 5),
    entry(2027, 'drivers'), // a season that does not exist yet
    entry(1949, 'drivers'), // before the championship
    entry(2025, 'podiums'), // a section this build does not have
    { year: '2024', section: 'drivers' }, // wrong type
    null,
    'nonsense',
    entry(2024, 'constructors', 3),
  ];
  assert.deepEqual(sanitiseRecents(stored, CURRENT), [
    entry(2026, 'drivers', 5),
    entry(2024, 'constructors', 3),
  ]);
});

test('duplicates collapse and a missing timestamp defaults', () => {
  const stored = [
    { year: 2026, section: 'drivers' },
    entry(2026, 'drivers', 9),
    entry(2026, 'constructors', 1),
  ];
  assert.deepEqual(sanitiseRecents(stored, CURRENT), [
    entry(2026, 'drivers', 0),
    entry(2026, 'constructors', 1),
  ]);
});

test('a stored list longer than the cap is truncated on read', () => {
  const stored = Array.from({ length: 20 }, (_, index) => entry(2026 - index, 'drivers', index));
  assert.equal(sanitiseRecents(stored, CURRENT).length, MAX_RECENT);
});

test('a new visit goes to the front', () => {
  const list = withRecent([], entry(2026, 'drivers', 1));
  assert.deepEqual(list, [entry(2026, 'drivers', 1)]);
  const next = withRecent(list, entry(2025, 'constructors', 2));
  assert.deepEqual(next, [entry(2025, 'constructors', 2), entry(2026, 'drivers', 1)]);
});

test('revisiting moves an entry up rather than duplicating it', () => {
  const list = [entry(2026, 'drivers', 1), entry(2025, 'constructors', 2)];
  const next = withRecent(list, entry(2025, 'constructors', 9));
  assert.deepEqual(next, [entry(2025, 'constructors', 9), entry(2026, 'drivers', 1)]);
});

test('the same season with a different section is a separate entry', () => {
  const list = withRecent([entry(2026, 'drivers', 1)], entry(2026, 'constructors', 2));
  assert.equal(list.length, 2);
});

test('the list never grows past the cap', () => {
  let list = [];
  for (let year = 2026; year > 2000; year -= 1) {
    list = withRecent(list, entry(year, 'drivers', year));
  }
  assert.equal(list.length, MAX_RECENT);
  assert.equal(list[0].year, 2001);
});
