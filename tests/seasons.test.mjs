import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  FIRST_CONSTRUCTORS_SEASON,
  FIRST_SEASON,
  decadeLabel,
  getCurrentSeason,
  groupSeasonsByDecade,
  hasConstructorsChampionship,
  isValidSeason,
  listSeasons,
  ordinal,
  parseSeason,
  seasonNumber,
} from '../src/domain/seasons.ts';

test('current season follows the calendar year', () => {
  assert.equal(getCurrentSeason(new Date('2026-09-06T00:00:00Z')), 2026);
  assert.equal(getCurrentSeason(new Date('2026-01-02T00:00:00Z')), 2026);
  assert.equal(getCurrentSeason(new Date('2031-12-31T00:00:00Z')), 2031);
});

test('current season never falls below the first championship', () => {
  assert.equal(getCurrentSeason(new Date('1930-05-01T00:00:00Z')), FIRST_SEASON);
});

test('seasons list runs newest to oldest and covers every year', () => {
  const seasons = listSeasons(2026);
  assert.equal(seasons[0], 2026);
  assert.equal(seasons[seasons.length - 1], FIRST_SEASON);
  assert.equal(seasons.length, 2026 - FIRST_SEASON + 1);
  assert.equal(new Set(seasons).size, seasons.length);
});

test('constructors championship starts in 1958', () => {
  assert.equal(hasConstructorsChampionship(1950), false);
  assert.equal(hasConstructorsChampionship(1957), false);
  assert.equal(hasConstructorsChampionship(FIRST_CONSTRUCTORS_SEASON), true);
  assert.equal(hasConstructorsChampionship(2026), true);
});

test('season validity is bounded on both sides', () => {
  assert.equal(isValidSeason(1950, 2026), true);
  assert.equal(isValidSeason(2026, 2026), true);
  assert.equal(isValidSeason(1949, 2026), false);
  assert.equal(isValidSeason(2027, 2026), false);
  assert.equal(isValidSeason(1990.5, 2026), false);
  assert.equal(isValidSeason(Number.NaN, 2026), false);
});

test('route parameters only parse into real seasons', () => {
  assert.equal(parseSeason('2026', 2026), 2026);
  assert.equal(parseSeason(' 1988 ', 2026), 1988);
  assert.equal(parseSeason(['1999'], 2026), 1999);
  assert.equal(parseSeason('2027', 2026), null);
  assert.equal(parseSeason('1949', 2026), null);
  assert.equal(parseSeason('20x6', 2026), null);
  assert.equal(parseSeason('', 2026), null);
  assert.equal(parseSeason(undefined, 2026), null);
  assert.equal(parseSeason('99', 2026), null);
});

test('season numbering counts 1950 as the first', () => {
  assert.equal(seasonNumber(1950), 1);
  assert.equal(seasonNumber(2026), 77);
});

test('ordinals handle the teens and the ones digit', () => {
  assert.equal(ordinal(1), '1st');
  assert.equal(ordinal(2), '2nd');
  assert.equal(ordinal(3), '3rd');
  assert.equal(ordinal(4), '4th');
  assert.equal(ordinal(11), '11th');
  assert.equal(ordinal(12), '12th');
  assert.equal(ordinal(13), '13th');
  assert.equal(ordinal(21), '21st');
  assert.equal(ordinal(72), '72nd');
  assert.equal(ordinal(77), '77th');
  assert.equal(ordinal(111), '111th');
});

test('decades group without gaps or duplicates', () => {
  const seasons = listSeasons(2026);
  const groups = groupSeasonsByDecade(seasons);
  assert.equal(groups[0].title, '2020s');
  assert.deepEqual(groups[0].data, [2026, 2025, 2024, 2023, 2022, 2021, 2020]);
  assert.equal(groups[groups.length - 1].title, '1950s');
  assert.equal(
    groups.reduce((total, group) => total + group.data.length, 0),
    seasons.length,
  );
  assert.equal(decadeLabel(1958), '1950s');
});
