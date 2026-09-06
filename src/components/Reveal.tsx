import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';
import { TIMING } from '@/theme/motion';
import { ENTER_OFFSET, STAGGER } from '@/theme/tokens';

export interface RevealProps {
  children: ReactNode;
  /** Position in the cascade. Keep the whole screen under ~8. */
  index?: number;
  /** Extra delay before the cascade starts, in ms. */
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * The app's single entrance pattern: content arrives from just below its
 * resting place while fading in, staggered so the eye reads top to bottom.
 * Skipped entirely when the system asks for reduced motion.
 */
export function Reveal({ children, index = 0, delay = 0, style }: RevealProps) {
  const { reducedMotion } = useTheme();
  const progress = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(delay + index * STAGGER, withTiming(1, TIMING.enter));
  }, [delay, index, progress, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * ENTER_OFFSET }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
