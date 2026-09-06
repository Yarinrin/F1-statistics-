import { isValidSeason } from './seasons';
import { isArchiveSection, type ArchiveSection } from './wikipedia';

/** How many entries the "recently viewed" list keeps. */
export const MAX_RECENT = 4;

export interface RecentEntry {
  year: number;
  section: ArchiveSection;
  at: number;
}

/**
 * Turns whatever came out of storage into a list we are willing to render.
 * Anything unrecognised — a season that does not exist, a section the app no
 * longer has, a duplicate — is dropped rather than repaired.
 */
export function sanitiseRecents(value: unknown, currentSeason: number): RecentEntry[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: RecentEntry[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const { year, section, at } = item as Partial<RecentEntry>;
    if (typeof year !== 'number' || !isValidSeason(year, currentSeason)) continue;
    if (!isArchiveSection(section)) continue;
    const id = `${year}:${section}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ year, section, at: typeof at === 'number' ? at : 0 });
    if (out.length >= MAX_RECENT) break;
  }
  return out;
}

/** Newest first, deduped by season + section, capped at {@link MAX_RECENT}. */
export function withRecent(
  recents: RecentEntry[],
  entry: RecentEntry,
  limit: number = MAX_RECENT,
): RecentEntry[] {
  const rest = recents.filter(
    (item) => !(item.year === entry.year && item.section === entry.section),
  );
  return [entry, ...rest].slice(0, limit);
}
