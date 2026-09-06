import type { SectionStatus } from './sectionScript';

/**
 * Why the reader has nothing to show.
 *  - `network`  the page could not be reached at all
 *  - `http`     Wikipedia answered, but not with a page
 *  - `crashed`  the platform's web view process went away under us
 */
export type ReaderErrorKind = 'network' | 'http' | 'crashed';

export interface ReaderError {
  kind: ReaderErrorKind;
  /** Technical detail, shown small. Never the whole message. */
  detail: string;
}

export interface WikipediaReaderProps {
  /** Mobile Wikipedia URL, anchor included when one is known. */
  url: string;
  anchor: string | null;
  /** Heading patterns for the in-page fallback search. */
  patterns: string[][];
  /** Article title, so the injected script only touches the season page. */
  articleTitle: string;
  /** Changing this remounts the view — used by "Try again". */
  reloadToken: number;
  onProgress: (progress: number) => void;
  onLoadingChange: (loading: boolean) => void;
  onError: (error: ReaderError | null) => void;
  onSectionStatus: (status: SectionStatus, label: string | null) => void;
}
