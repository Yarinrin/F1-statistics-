import AsyncStorage from '@react-native-async-storage/async-storage';

import { sanitiseRecents, type RecentEntry } from '@/domain/recents';
import { isValidSeason } from '@/domain/seasons';
import type { ArchiveSection } from '@/domain/wikipedia';

/**
 * Local persistence. Every read returns a sane default and every write is
 * best-effort: storage is a convenience here, never a dependency, so a
 * corrupted or unavailable store degrades to a first-run experience.
 */

export type ThemeMode = 'system' | 'light' | 'dark';

const KEY = {
  themeMode: 'apex.theme-mode.v1',
  recent: 'apex.recent.v1',
  pinned: 'apex.pinned-season.v1',
  anchor: 'apex.section-anchor.v1',
} as const;

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Persistence is optional; the in-memory state is already correct. */
  }
}

async function remove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    /* no-op */
  }
}

/* ------------------------------- theme mode ------------------------------- */

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

export async function loadThemeMode(): Promise<ThemeMode> {
  try {
    const raw = await AsyncStorage.getItem(KEY.themeMode);
    return isThemeMode(raw) ? raw : 'system';
  } catch {
    return 'system';
  }
}

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY.themeMode, mode);
  } catch {
    /* no-op */
  }
}

/* --------------------------------- recents -------------------------------- */

export async function loadRecents(currentSeason: number): Promise<RecentEntry[]> {
  return sanitiseRecents(await readJson<unknown>(KEY.recent), currentSeason);
}

export async function saveRecents(recents: RecentEntry[]): Promise<void> {
  await writeJson(KEY.recent, recents);
}

export async function clearRecents(): Promise<void> {
  await remove(KEY.recent);
}

/* --------------------------------- pinned --------------------------------- */

export async function loadPinnedSeason(currentSeason: number): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY.pinned);
    if (!raw) return null;
    const year = Number.parseInt(raw, 10);
    return isValidSeason(year, currentSeason) ? year : null;
  } catch {
    return null;
  }
}

export async function savePinnedSeason(year: number | null): Promise<void> {
  if (year === null) {
    await remove(KEY.pinned);
    return;
  }
  try {
    await AsyncStorage.setItem(KEY.pinned, String(year));
  } catch {
    /* no-op */
  }
}

/* ------------------------------ anchor cache ------------------------------ */

interface CachedAnchor {
  anchor: string | null;
  line: string | null;
  at: number;
}

/** Section headings change rarely; a month keeps lookups off the critical path. */
export const ANCHOR_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function anchorKey(year: number, section: ArchiveSection): string {
  return `${KEY.anchor}.${year}.${section}`;
}

export async function loadCachedAnchor(
  year: number,
  section: ArchiveSection,
  now: number = Date.now(),
): Promise<{ anchor: string | null; line: string | null } | null> {
  const cached = await readJson<CachedAnchor>(anchorKey(year, section));
  if (!cached || typeof cached.at !== 'number') return null;
  if (now - cached.at > ANCHOR_TTL_MS) return null;
  return { anchor: cached.anchor ?? null, line: cached.line ?? null };
}

export async function saveCachedAnchor(
  year: number,
  section: ArchiveSection,
  value: { anchor: string | null; line: string | null },
): Promise<void> {
  await writeJson(anchorKey(year, section), { ...value, at: Date.now() } satisfies CachedAnchor);
}
