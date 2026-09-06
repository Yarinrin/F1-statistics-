import { useEffect, useRef, useState } from 'react';

import {
  SECTIONS,
  resolveSection,
  type ArchiveSection,
  type ResolvedSection,
} from '@/domain/wikipedia';
import { loadCachedAnchor, saveCachedAnchor } from '@/storage/prefs';

/** Session-lifetime cache so a second visit resolves without any await. */
const memory = new Map<string, { anchor: string | null; line: string | null }>();

const keyOf = (year: number, section: ArchiveSection) => `${year}:${section}`;

export function peekSectionAnchor(
  year: number,
  section: ArchiveSection,
): { anchor: string | null; line: string | null } | null {
  return memory.get(keyOf(year, section)) ?? null;
}

/**
 * Looks up the section anchor for a season, cheapest source first:
 * memory -> device cache -> Wikipedia's section index.
 *
 * Only verified results (ones that came from the live index) are cached, so a
 * failed lookup is retried next time rather than remembered as truth.
 */
export async function loadSectionAnchor(
  year: number,
  section: ArchiveSection,
): Promise<{ anchor: string | null; line: string | null }> {
  const key = keyOf(year, section);
  const hit = memory.get(key);
  if (hit) return hit;

  const cached = await loadCachedAnchor(year, section);
  if (cached) {
    memory.set(key, cached);
    return cached;
  }

  const resolved: ResolvedSection = await resolveSection(year, section);
  const value = { anchor: resolved.anchor, line: resolved.line };
  if (resolved.source === 'index') {
    memory.set(key, value);
    void saveCachedAnchor(year, section, value);
  }
  return value;
}

/** Warms the cache without rendering anything. Failures are ignored. */
export function prefetchSectionAnchor(year: number, section: ArchiveSection): void {
  if (memory.has(keyOf(year, section))) return;
  void loadSectionAnchor(year, section).catch(() => undefined);
}

export interface SectionAnchorState {
  /** Best anchor known right now — may be the hard-coded fallback. */
  anchor: string | null;
  /** Wikipedia's own heading text, once the live index has confirmed it. */
  line: string | null;
  resolving: boolean;
}

export function useSectionAnchor(year: number, section: ArchiveSection): SectionAnchorState {
  const initial = peekSectionAnchor(year, section);
  const [state, setState] = useState<SectionAnchorState>(() => ({
    anchor: initial?.anchor ?? SECTIONS[section].fallbackAnchor,
    line: initial?.line ?? null,
    resolving: !initial,
  }));
  const requestRef = useRef(0);

  useEffect(() => {
    const request = ++requestRef.current;
    const known = peekSectionAnchor(year, section);
    setState({
      anchor: known?.anchor ?? SECTIONS[section].fallbackAnchor,
      line: known?.line ?? null,
      resolving: !known,
    });
    if (known) return;

    let cancelled = false;
    loadSectionAnchor(year, section)
      .then((value) => {
        if (cancelled || requestRef.current !== request) return;
        setState({ anchor: value.anchor, line: value.line, resolving: false });
      })
      .catch(() => {
        if (cancelled || requestRef.current !== request) return;
        setState((current) => ({ ...current, resolving: false }));
      });

    return () => {
      cancelled = true;
    };
  }, [year, section]);

  return state;
}
