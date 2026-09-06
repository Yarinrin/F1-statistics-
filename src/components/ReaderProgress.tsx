import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';
import { EASE, TIMING } from '@/theme/motion';

const BAR_HEIGHT = 2;

/**
 * Loading is the one place the archive uses motion to pass time rather than to
 * answer a tap: a timing-strip that fills as the page arrives, runs to full,
 * then clears itself away.
 */
export function ReaderProgress({
  progress,
  loading,
  visible,
}: {
  progress: number;
  loading: boolean;
  visible: boolean;
}) {
  const { palette, reducedMotion } = useTheme();
  const fill = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      opacity.value = 0;
      fill.value = 0;
      return;
    }
    if (loading) {
      opacity.value = withTiming(1, TIMING.quick);
      // Never claim to be finished while the page is still coming in.
      const clamped = Math.min(Math.max(progress, 0.08), 0.94);
      fill.value = reducedMotion ? clamped : withTiming(clamped, TIMING.standard);
      return;
    }
    fill.value = withTiming(1, { duration: 180, easing: EASE.out });
    opacity.value = withDelay(200, withTiming(0, TIMING.exit));
  }, [fill, loading, opacity, progress, reducedMotion, visible]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    width: `${fill.value * 100}%`,
  }));

  return (
    <View
      accessible={false}
      style={{ height: BAR_HEIGHT, width: '100%', overflow: 'hidden' }}
    >
      <Animated.View style={[{ height: BAR_HEIGHT, backgroundColor: palette.accent }, style]} />
    </View>
  );
}
