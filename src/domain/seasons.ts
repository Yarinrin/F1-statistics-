/**
 * Season model.
 *
 * Deliberately data-free: the archive is generated from the calendar, not from a
 * bundled database. When native standings arrive later, they attach to these
 * primitives rather than replacing them.
 */

/** First Formula One World Championship season. */
export const FIRST_SEASON = 1950;

/** The World Constructors' Championship was first awarded in 1958. */
export const FIRST_CONSTRUCTORS_SEASON = 1958;

/**
 * The season the app treats as "current".
 *
 * Wikipedia publishes a season article long before lights out, so the calendar
 * year is both correct during a season and correct in the winter gap.
 */
export function getCurrentSeason(now: Date = new Date()): number {
  const year = now.getFullYear();
  return Number.isFinite(year) ? Math.max(FIRST_SEASON, year) : FIRST_SEASON;
}

/** Every season, newest first. */
export function listSeasons(current: number = getCurrentSeason()): number[] {
  const last = Math.max(FIRST_SEASON, current);
  const years: number[] = [];
  for (let year = last; year >= FIRST_SEASON; year -= 1) years.push(year);
  return years;
}

export function isValidSeason(year: number, current: number = getCurrentSeason()): boolean {
  return Number.isInteger(year) && year >= FIRST_SEASON && year <= Math.max(FIRST_SEASON, current);
}

export function hasConstructorsChampionship(year: number): boolean {
  return year >= FIRST_CONSTRUCTORS_SEASON;
}

/** 1950 is the 1st championship season, 2026 the 77th. */
export function seasonNumber(year: number): number {
  return year - FIRST_SEASON + 1;
}

/** 1 -> "1st", 22 -> "22nd", 77 -> "77th". */
export function ordinal(value: number): string {
  const abs = Math.abs(Math.trunc(value));
  const lastTwo = abs % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${value}th`;
  switch (abs % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

export function decadeOf(year: number): number {
  return Math.floor(year / 10) * 10;
}

export function decadeLabel(year: number): string {
  return `${decadeOf(year)}s`;
}

/**
 * Parses a season out of a route parameter. Returns null for anything that is
 * not a real season so screens can render a "season not in the archive" state
 * instead of guessing.
 */
export function parseSeason(
  raw: string | string[] | undefined,
  current: number = getCurrentSeason(),
): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^\d{4}$/.test(trimmed)) return null;
  const year = Number.parseInt(trimmed, 10);
  return isValidSeason(year, current) ? year : null;
}

/** Groups seasons into decades, newest first, for the archive browser. */
export function groupSeasonsByDecade(
  seasons: number[],
): { decade: number; title: string; data: number[] }[] {
  const groups: { decade: number; title: string; data: number[] }[] = [];
  for (const year of seasons) {
    const decade = decadeOf(year);
    const last = groups[groups.length - 1];
    if (last && last.decade === decade) last.data.push(year);
    else groups.push({ decade, title: `${decade}s`, data: [year] });
  }
  return groups;
}
