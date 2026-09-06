import { Platform, type TextStyle } from 'react-native';

import { TYPE, type TypeToken } from './tokens';

/**
 * Two families, clearly distinct in job:
 *   Archivo      — a grotesque with tight, engineered numerals. Everything read.
 *   JetBrains Mono — technical metadata only: season codes, counts, sources.
 *
 * Fonts are bundled with the app, so loading needs no network. If loading fails
 * anyway the app renders in the platform's own faces rather than crashing on a
 * missing family, which is why nothing references a family name directly.
 */

export type FontRole = 'regular' | 'medium' | 'semibold' | 'bold' | 'mono' | 'monoMedium';

const LOADED: Record<FontRole, string> = {
  regular: 'Archivo_400Regular',
  medium: 'Archivo_500Medium',
  semibold: 'Archivo_600SemiBold',
  bold: 'Archivo_700Bold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
};

const SYSTEM_MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

const SYSTEM_WEIGHTS: Record<FontRole, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  mono: '400',
  monoMedium: '500',
};

/**
 * Resolves a role to a concrete `fontFamily` / `fontWeight` pair. Before the
 * bundled faces are ready this returns the system stack, so text is never
 * pointed at a family that does not exist.
 */
export function fontStyle(role: FontRole, fontsReady: boolean): TextStyle {
  if (fontsReady) return { fontFamily: LOADED[role] };
  return {
    fontFamily: role === 'mono' || role === 'monoMedium' ? SYSTEM_MONO : undefined,
    fontWeight: SYSTEM_WEIGHTS[role],
  };
}

export interface TextTokenOptions {
  role?: FontRole;
  uppercase?: boolean;
}

const DEFAULT_ROLE: Record<TypeToken, FontRole> = {
  hero: 'bold',
  display: 'bold',
  year: 'semibold',
  title: 'bold',
  heading: 'semibold',
  body: 'regular',
  small: 'regular',
  label: 'monoMedium',
  micro: 'monoMedium',
};

export function textStyle(
  token: TypeToken,
  fontsReady: boolean,
  options: TextTokenOptions = {},
): TextStyle {
  const role = options.role ?? DEFAULT_ROLE[token];
  const base = TYPE[token];
  return {
    fontSize: base.fontSize,
    lineHeight: base.lineHeight,
    letterSpacing: base.letterSpacing,
    ...fontStyle(role, fontsReady),
    ...(options.uppercase ? { textTransform: 'uppercase' as const } : null),
  };
}

/** Font map handed to `useFonts`. Only the six faces the app actually sets. */
export const FONT_ROLES = LOADED;
