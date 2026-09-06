import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { HAIRLINE, SPACE } from '@/theme/tokens';

import { Type } from './Type';

export type ChevronDirection = 'right' | 'left' | 'down' | 'up';

const ROTATION: Record<ChevronDirection, string> = {
  right: '45deg',
  left: '225deg',
  down: '135deg',
  up: '315deg',
};

/** Navigation caret, drawn from two hairlines rather than set as a glyph. */
export function Chevron({
  size = 9,
  weight = 1.6,
  color,
  direction = 'right',
}: {
  size?: number;
  weight?: number;
  color?: string;
  direction?: ChevronDirection;
}) {
  const { palette } = useTheme();
  return (
    <View
      accessible={false}
      style={{
        width: size,
        height: size,
        borderTopWidth: weight,
        borderRightWidth: weight,
        borderColor: color ?? palette.textFaint,
        transform: [{ rotate: ROTATION[direction] }],
      }}
    />
  );
}

/** Hairline rule. Structure, not decoration: it separates, it never fills. */
export function Rule({ style, strong }: { style?: StyleProp<ViewStyle>; strong?: boolean }) {
  const { palette } = useTheme();
  return (
    <View style={[{ height: HAIRLINE, backgroundColor: strong ? palette.lineStrong : palette.line }, style]} />
  );
}

/**
 * Editorial section marker: a label, a rule that takes up the slack, and an
 * optional count on the right. The rule encodes where a section starts.
 */
export function SectionLabel({
  children,
  meta,
  uppercase = true,
  style,
}: {
  children: string;
  meta?: string;
  /** Off for labels that already carry their own case, like "2020s". */
  uppercase?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: SPACE.md }, style]}>
      <Type token="micro" color="faint" uppercase={uppercase} accessibilityRole="header">
        {children}
      </Type>
      <Rule style={{ flex: 1 }} />
      {meta ? (
        <Type token="micro" color="faint" uppercase>
          {meta}
        </Type>
      ) : null}
    </View>
  );
}

/** The red positional marker. Used sparingly: current season, primary action. */
export function AccentMark({
  height = 20,
  width = 3,
  stretch,
}: {
  height?: number;
  width?: number;
  /** Runs the full height of its row, as a spine rather than a tick. */
  stretch?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <View
      accessible={false}
      style={{
        width,
        borderRadius: width / 2,
        backgroundColor: palette.accent,
        ...(stretch ? { alignSelf: 'stretch' as const } : { height }),
      }}
    />
  );
}

export function Badge({ label, tone = 'accent' }: { label: string; tone?: 'accent' | 'neutral' }) {
  const { palette } = useTheme();
  const isAccent = tone === 'accent';
  return (
    <View
      style={{
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 4,
        backgroundColor: isAccent ? palette.accentWash : 'transparent',
        borderWidth: HAIRLINE,
        borderColor: isAccent ? 'transparent' : palette.line,
      }}
    >
      <Type token="micro" color={isAccent ? 'accent' : 'faint'} uppercase>
        {label}
      </Type>
    </View>
  );
}
