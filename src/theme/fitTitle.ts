/**
 * Display type set at 60pt only fits words of about nine characters across a
 * phone, and the archive's state-screen titles are written for meaning, not
 * for length. Rather than hyphenating "CONSTRUCTORS" across two lines, the
 * title is fitted to the longest word it actually contains.
 */

export const MIN_TITLE_SIZE = 30;

/** Average advance of an uppercase Archivo Bold glyph, in ems. */
const UPPERCASE_ADVANCE = 0.68;

export function fitTitleSize(title: string, availableWidth: number, maxSize: number): number {
  const longest = title.split(/\s+/).reduce((max, word) => Math.max(max, word.length), 0);
  if (longest === 0 || availableWidth <= 0) return maxSize;
  const fitted = Math.floor(availableWidth / (longest * UPPERCASE_ADVANCE));
  return Math.max(MIN_TITLE_SIZE, Math.min(maxSize, fitted));
}
