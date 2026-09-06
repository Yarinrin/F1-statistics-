import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getCurrentSeason } from '@/domain/seasons';
import type { ArchiveSection } from '@/domain/wikipedia';
import { withRecent, type RecentEntry } from '@/domain/recents';
import {
  clearRecents as clearStoredRecents,
  loadPinnedSeason,
  loadRecents,
  savePinnedSeason,
  saveRecents,
} from '@/storage/prefs';

export interface ArchiveValue {
  /** Fixed for the lifetime of the session so lists never re-key mid-scroll. */
  currentSeason: number;
  recents: RecentEntry[];
  pinnedSeason: number | null;
  recordVisit: (year: number, section: ArchiveSection) => void;
  togglePin: (year: number) => void;
  clearRecents: () => void;
}

const ArchiveContext = createContext<ArchiveValue | null>(null);

export function useArchive(): ArchiveValue {
  const value = useContext(ArchiveContext);
  if (!value) throw new Error('useArchive must be used inside <ArchiveProvider>');
  return value;
}

export function ArchiveProvider({ children }: { children: ReactNode }) {
  const [currentSeason] = useState(() => getCurrentSeason());
  const [recents, setRecents] = useState<RecentEntry[]>([]);
  const [pinnedSeason, setPinnedSeason] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadRecents(currentSeason), loadPinnedSeason(currentSeason)]).then(
      ([storedRecents, storedPin]) => {
        if (cancelled) return;
        setRecents(storedRecents);
        setPinnedSeason(storedPin);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [currentSeason]);

  const recordVisit = useCallback((year: number, section: ArchiveSection) => {
    setRecents((current) => {
      const next = withRecent(current, { year, section, at: Date.now() });
      void saveRecents(next);
      return next;
    });
  }, []);

  const togglePin = useCallback((year: number) => {
    setPinnedSeason((current) => {
      const next = current === year ? null : year;
      void savePinnedSeason(next);
      return next;
    });
  }, []);

  const clearRecents = useCallback(() => {
    setRecents([]);
    void clearStoredRecents();
  }, []);

  const value = useMemo<ArchiveValue>(
    () => ({ currentSeason, recents, pinnedSeason, recordVisit, togglePin, clearRecents }),
    [currentSeason, recents, pinnedSeason, recordVisit, togglePin, clearRecents],
  );

  return <ArchiveContext.Provider value={value}>{children}</ArchiveContext.Provider>;
}
