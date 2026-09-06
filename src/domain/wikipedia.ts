/**
 * Wikipedia is the archive's source of truth for v1.
 *
 * The reliability contract, in one sentence: **the destination page is always
 * the season's own article, and the section is only ever a scroll position.**
 * Every lookup below can fail and the worst outcome is the top of the correct
 * season page — never a wrong page, never a dead button.
 */

export type ArchiveSection = 'drivers' | 'constructors' | 'races' | 'season';

export interface SectionDefinition {
  id: ArchiveSection;
  /** Card title. */
  title: string;
  /** Card supporting line. */
  subtitle: string;
  /** Shown in the reader while the section is being located. */
  target: string;
  /**
   * Heading patterns, most specific first. Every token of a pattern must appear
   * in a heading for it to match, so "World Drivers' Championship standings"
   * also matches the older "World Drivers' Championship final standings".
   */
  headingPatterns: string[][];
  /** Used when the live section index cannot be fetched. */
  fallbackAnchor: string | null;
}

export const SECTIONS: Record<ArchiveSection, SectionDefinition> = {
  drivers: {
    id: 'drivers',
    title: 'Drivers',
    subtitle: 'World Championship',
    target: "World Drivers' Championship standings",
    headingPatterns: [
      ['world', 'drivers', 'championship', 'standings'],
      ['drivers', 'championship', 'standings'],
      ['drivers', 'standings'],
      ['world', 'drivers', 'championship'],
    ],
    fallbackAnchor: "World_Drivers'_Championship_standings",
  },
  constructors: {
    id: 'constructors',
    title: 'Constructors',
    subtitle: 'World Championship',
    target: "World Constructors' Championship standings",
    headingPatterns: [
      ['world', 'constructors', 'championship', 'standings'],
      ['constructors', 'championship', 'standings'],
      ['constructors', 'standings'],
      ['world', 'constructors', 'championship'],
    ],
    fallbackAnchor: "World_Constructors'_Championship_standings",
  },
  races: {
    id: 'races',
    title: 'Race results',
    subtitle: 'Round by round',
    target: 'Grands Prix',
    headingPatterns: [
      ['grands', 'prix'],
      ['race', 'results'],
      ['results', 'standings'],
      ['results'],
    ],
    fallbackAnchor: 'Grands_Prix',
  },
  season: {
    id: 'season',
    title: 'Season overview',
    subtitle: 'Entries, calendar, report',
    target: 'Season article',
    headingPatterns: [],
    fallbackAnchor: null,
  },
};

export const SECTION_IDS: ArchiveSection[] = ['drivers', 'constructors', 'races', 'season'];

export function isArchiveSection(value: unknown): value is ArchiveSection {
  return typeof value === 'string' && (SECTION_IDS as string[]).includes(value);
}

export function parseArchiveSection(raw: string | string[] | undefined): ArchiveSection | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return isArchiveSection(value) ? value : null;
}

/* -------------------------------------------------------------------------- */
/* Article addresses                                                           */
/* -------------------------------------------------------------------------- */

const DESKTOP_HOST = 'https://en.wikipedia.org';
const MOBILE_HOST = 'https://en.m.wikipedia.org';

/** e.g. `2026_Formula_One_World_Championship` */
export function seasonArticleTitle(year: number): string {
  return `${year}_Formula_One_World_Championship`;
}

export function seasonArticlePath(year: number): string {
  return `/wiki/${seasonArticleTitle(year)}`;
}

export interface ArticleUrlOptions {
  /** Mobile Wikipedia renders far better inside the in-app reader. */
  mobile?: boolean;
  /** Section anchor, if one is known. Unknown anchors land at the top. */
  anchor?: string | null;
}

export function seasonArticleUrl(year: number, options: ArticleUrlOptions = {}): string {
  const host = options.mobile ? MOBILE_HOST : DESKTOP_HOST;
  const anchor = normaliseAnchor(options.anchor);
  return `${host}${seasonArticlePath(year)}${anchor ? `#${anchor}` : ''}`;
}

/** The link worth pasting into a chat: canonical desktop, with the section. */
export function seasonShareUrl(year: number, anchor?: string | null): string {
  return seasonArticleUrl(year, { mobile: false, anchor });
}

export function sectionsApiUrl(year: number): string {
  const params = new URLSearchParams({
    action: 'parse',
    format: 'json',
    formatversion: '2',
    prop: 'sections',
    redirects: '1',
    page: seasonArticleTitle(year),
    origin: '*',
  });
  return `${DESKTOP_HOST}/w/api.php?${params.toString()}`;
}

/** Trims and strips a leading `#`; returns null for anything unusable. */
export function normaliseAnchor(anchor: string | null | undefined): string | null {
  if (typeof anchor !== 'string') return null;
  const trimmed = anchor.trim().replace(/^#+/, '');
  if (!trimmed || /\s/.test(trimmed)) return trimmed ? trimmed.replace(/\s+/g, '_') : null;
  return trimmed;
}

/* -------------------------------------------------------------------------- */
/* Section matching                                                            */
/* -------------------------------------------------------------------------- */

export interface WikiSection {
  line: string;
  anchor: string;
  toclevel?: number;
}

/**
 * Heading text -> comparable tokens. Strips markup, apostrophes (so
 * "Drivers'" and "Drivers" agree) and any other punctuation.
 */
export function headingTokens(text: string): string[] {
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .toLowerCase()
    .replace(/[‘’'`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

function matchesPattern(tokens: string[], pattern: string[]): boolean {
  return pattern.every((token) => tokens.includes(token));
}

/**
 * Finds the anchor for a section in a live section index. Patterns are tried
 * most-specific first so a season that still calls it "World Drivers'
 * Championship" is found after the modern "...standings" heading misses.
 */
export function matchSectionAnchor(
  sections: WikiSection[],
  section: ArchiveSection,
): { anchor: string; line: string } | null {
  const definition = SECTIONS[section];
  if (!definition.headingPatterns.length) return null;

  const indexed = sections
    .filter((entry) => entry && typeof entry.anchor === 'string' && entry.anchor.length > 0)
    .map((entry) => ({ entry, tokens: headingTokens(entry.line ?? '') }));

  for (const pattern of definition.headingPatterns) {
    for (const { entry, tokens } of indexed) {
      if (matchesPattern(tokens, pattern)) {
        const anchor = normaliseAnchor(entry.anchor);
        if (anchor) return { anchor, line: stripMarkup(entry.line ?? '') };
      }
    }
  }
  return null;
}

export function stripMarkup(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Parses a MediaWiki `action=parse&prop=sections` payload defensively. */
export function readSectionIndex(payload: unknown): WikiSection[] | null {
  if (!payload || typeof payload !== 'object') return null;
  const parse = (payload as { parse?: unknown }).parse;
  if (!parse || typeof parse !== 'object') return null;
  const sections = (parse as { sections?: unknown }).sections;
  if (!Array.isArray(sections)) return null;
  return sections
    .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
    .map((entry) => ({
      line: typeof entry.line === 'string' ? entry.line : '',
      anchor: typeof entry.anchor === 'string' ? entry.anchor : '',
      toclevel: typeof entry.toclevel === 'number' ? entry.toclevel : undefined,
    }));
}

/* -------------------------------------------------------------------------- */
/* Live lookup                                                                 */
/* -------------------------------------------------------------------------- */

export interface ResolvedSection {
  anchor: string | null;
  /** The heading exactly as Wikipedia titles it, when we found one. */
  line: string | null;
  source: 'index' | 'fallback' | 'none';
}

export const SECTION_LOOKUP_TIMEOUT_MS = 7000;

/**
 * Asks Wikipedia for the season article's section index and picks the anchor.
 *
 * Never throws: a network failure, a timeout or an unexpected payload all
 * degrade to the hard-coded anchor, and then to no anchor at all.
 */
export async function resolveSection(
  year: number,
  section: ArchiveSection,
  options: { timeoutMs?: number; fetchImpl?: typeof fetch } = {},
): Promise<ResolvedSection> {
  const definition = SECTIONS[section];
  if (!definition.headingPatterns.length) {
    return { anchor: null, line: null, source: 'none' };
  }

  const fallback: ResolvedSection = {
    anchor: normaliseAnchor(definition.fallbackAnchor),
    line: null,
    source: 'fallback',
  };

  const doFetch = options.fetchImpl ?? globalThis.fetch;
  if (typeof doFetch !== 'function') return fallback;

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? SECTION_LOOKUP_TIMEOUT_MS,
  );

  try {
    const response = await doFetch(sectionsApiUrl(year), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return fallback;
    const sections = readSectionIndex(await response.json());
    if (!sections) return fallback;
    const match = matchSectionAnchor(sections, section);
    if (!match) return fallback;
    return { anchor: match.anchor, line: match.line || null, source: 'index' };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
