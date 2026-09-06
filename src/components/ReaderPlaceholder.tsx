import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';
import { HAIRLINE, RADIUS, SPACE } from '@/theme/tokens';

import { Type } from './Type';

const ROWS = [
  { name: '62%', points: 34 },
  { name: '78%', points: 30 },
  { name: '54%', points: 34 },
  { name: '70%', points: 28 },
  { name: '58%', points: 32 },
  { name: '74%', points: 30 },
] as const;

/**
 * Shown while the page is on its way. It is shaped like a standings table on
 * purpose: it sets the expectation of what is arriving instead of leaving the
 * reader as an empty rectangle.
 */
export function ReaderPlaceholder({ label }: { label: string }) {
  const { palette, reducedMotion } = useTheme();
  const breathe = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      breathe.value = 1;
      return;
    }
    breathe.value = withRepeat(
      withTiming(0.45, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breathe, reducedMotion]);

  const pulse = useAnimatedStyle(() => ({ opacity: breathe.value }));

  const bar = (width: number | `${number}%`, height = 11) => ({
    width,
    height,
    borderRadius: RADIUS.sm - 3,
    backgroundColor: palette.inert,
  });

  return (
    <View
      pointerEvents="none"
      accessible
      accessibilityLabel={label}
      style={{ flex: 1, paddingHorizontal: SPACE.gutter, paddingTop: SPACE.xl }}
    >
      <Animated.View style={pulse}>
        <View style={bar('46%', 20)} />
        <View
          style={{
            height: HAIRLINE,
            backgroundColor: palette.line,
            marginTop: SPACE.lg,
            marginBottom: SPACE.lg,
          }}
        />
        {ROWS.map((row, index) => (
          <View
            key={index}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACE.md,
              paddingVertical: SPACE.md,
            }}
          >
            <View style={bar(14)} />
            <View style={[bar(row.name), { flex: 0 }]} />
            <View style={{ flex: 1 }} />
            <View style={bar(row.points)} />
          </View>
        ))}
      </Animated.View>
      <Type token="micro" color="faint" uppercase style={{ marginTop: SPACE.xl }}>
        {label}
      </Type>
    </View>
  );
}
