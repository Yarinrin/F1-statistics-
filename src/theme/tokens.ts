/**
 * Design tokens.
 *
 * Direction: a motorsport press archive. Near-black or warm paper, one signal
 * red used as a positional marker (never as decoration), hairline rules,
 * oversized numerals, monospaced technical metadata.
 */

export type ColorScheme = 'dark' | 'light';

export interface Palette {
  /** Page ground. */
  bg: string;
  /** Ground for headers and sheets that sit above the page. */
  bgRaised: string;
  /** Card fill. */
  surface: string;
  /** Card fill while held. */
  surfacePressed: string;
  /** Hairline rules and card borders. */
  line: string;
  /** Rules that need to read as structure, not texture. */
  lineStrong: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  /** Text placed on top of `accent`. */
  onAccent: string;
  /** Low-alpha accent for fills and markers. */
  accentWash: string;
  scrim: string;
  /** Skeleton / inert bar fill. */
  inert: string;
}

const dark: Palette = {
  bg: '#0B0C0E',
  bgRaised: '#101216',
  surface: '#141619',
  surfacePressed: '#1C1F25',
  line: '#26292F',
  lineStrong: '#3B3F47',
  text: '#F3F1EC',
  textMuted: '#9AA0A8',
  textFaint: '#6E727A',
  accent: '#E62634',
  onAccent: '#FFFFFF',
  accentWash: 'rgba(230, 38, 52, 0.14)',
  scrim: 'rgba(0, 0, 0, 0.66)',
  inert: '#20232A',
};

const light: Palette = {
  bg: '#F2F1EC',
  bgRaised: '#F7F6F2',
  surface: '#FFFFFF',
  surfacePressed: '#EAE8E1',
  line: '#DAD6CC',
  lineStrong: '#B6B1A5',
  text: '#141518',
  textMuted: '#67635B',
  textFaint: '#7E796E',
  accent: '#C1121F',
  onAccent: '#FFFFFF',
  accentWash: 'rgba(193, 18, 31, 0.10)',
  scrim: 'rgba(20, 21, 24, 0.45)',
  inert: '#E3E0D8',
};

export const PALETTES: Record<ColorScheme, Palette> = { dark, light };

/** 4pt base. Screens breathe at `gutter`. */
export const SPACE = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  gutter: 22,
} as const;

export const RADIUS = {
  /** Chips and markers. */
  sm: 6,
  /** Rows. */
  md: 12,
  /** Cards. */
  lg: 18,
  /** Sheets. */
  xl: 26,
  pill: 999,
} as const;

export const HAIRLINE = 1;

/**
 * Type scale. Display sizes carry negative tracking so large numerals set
 * tightly; label sizes carry positive tracking so small caps stay legible.
 */
export const TYPE = {
  hero: { fontSize: 84, lineHeight: 78, letterSpacing: -4 },
  display: { fontSize: 60, lineHeight: 58, letterSpacing: -2.6 },
  year: { fontSize: 40, lineHeight: 42, letterSpacing: -1.6 },
  title: { fontSize: 27, lineHeight: 30, letterSpacing: -0.8 },
  heading: { fontSize: 19, lineHeight: 23, letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 21, letterSpacing: 0 },
  small: { fontSize: 13, lineHeight: 18, letterSpacing: 0 },
  label: { fontSize: 12, lineHeight: 15, letterSpacing: 1.1 },
  micro: { fontSize: 10, lineHeight: 13, letterSpacing: 1.4 },
} as const;

export type TypeToken = keyof typeof TYPE;

/**
 * Motion. One personality throughout: premium — decisive, no overshoot,
 * nothing bounces. Durations are the only three the app uses.
 */
export const DURATION = {
  /** Press-in, tint changes. */
  quick: 130,
  /** Cards, rows, chips. */
  standard: 260,
  /** Screen-level and theme changes. */
  slow: 380,
} as const;

/** Cascade delay between siblings. Total budget stays under 400ms. */
export const STAGGER = 45;

/** Cards enter from below by this much: arrival, not flight. */
export const ENTER_OFFSET = 14;

export const PRESS_SCALE = 0.978;

/** Minimum tappable height. */
export const TOUCH_TARGET = 48;
