import { Text, type TextProps } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import type { TypeToken } from '@/theme/tokens';
import type { FontRole } from '@/theme/typography';

export type TypeColor = 'text' | 'muted' | 'faint' | 'accent' | 'onAccent';

/**
 * Text scaling caps: display sizes are already large and would break the
 * layout if doubled, body text is allowed to grow far more.
 */
const MAX_SCALE: Record<TypeToken, number> = {
  hero: 1.1,
  display: 1.15,
  year: 1.2,
  title: 1.3,
  heading: 1.4,
  body: 1.7,
  small: 1.7,
  label: 1.5,
  micro: 1.5,
};

export interface TypeProps extends TextProps {
  token?: TypeToken;
  /** Overrides the token's default face, e.g. a bold year in a regular row. */
  weight?: FontRole;
  color?: TypeColor;
  uppercase?: boolean;
}

export function Type({
  token = 'body',
  weight,
  color = 'text',
  uppercase,
  style,
  ...rest
}: TypeProps) {
  const { t, palette } = useTheme();
  const colorValue = {
    text: palette.text,
    muted: palette.textMuted,
    faint: palette.textFaint,
    accent: palette.accent,
    onAccent: palette.onAccent,
  }[color];

  return (
    <Text
      maxFontSizeMultiplier={MAX_SCALE[token]}
      {...rest}
      style={[t(token, { role: weight, uppercase }), { color: colorValue }, style]}
    />
  );
}
