import * as Haptics from 'expo-haptics';
import { useCallback, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  type AccessibilityRole,
  type AccessibilityState,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';
import { TIMING } from '@/theme/motion';
import { PRESS_SCALE } from '@/theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type SurfaceVariant = 'card' | 'plain' | 'accent';

export interface PressableSurfaceProps {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  variant?: SurfaceVariant;
  /** Light haptic tick on press. Off for low-stakes rows. */
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  /** Selection state for radio/checkbox-style surfaces. */
  checked?: boolean;
  testID?: string;
}

function tick(kind: SurfaceVariant) {
  if (Platform.OS === 'web') return;
  const run = kind === 'accent' ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) : Haptics.selectionAsync();
  run.catch(() => {
    /* haptics are a bonus, never a requirement */
  });
}

/**
 * Every tappable surface in the app. Press is answered within a frame: the
 * surface sinks slightly and its fill and border deepen together, then settles
 * back a touch more slowly than it went down.
 */
export function PressableSurface({
  children,
  onPress,
  onLongPress,
  disabled = false,
  variant = 'card',
  haptic = false,
  style,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilityState,
  checked,
  testID,
}: PressableSurfaceProps) {
  const { palette, reducedMotion } = useTheme();
  const pressed = useSharedValue(0);

  const fill = variant === 'accent' ? palette.accent : palette.surface;
  const fillPressed = variant === 'accent' ? palette.accent : palette.surfacePressed;

  const handlePressIn = useCallback(() => {
    pressed.value = withTiming(1, TIMING.press);
    if (haptic) tick(variant);
  }, [haptic, pressed, variant]);

  const handlePressOut = useCallback(() => {
    pressed.value = withTiming(0, TIMING.release);
  }, [pressed]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = reducedMotion ? 1 : 1 - pressed.value * (1 - PRESS_SCALE);
    const base: Record<string, unknown> = {
      transform: [{ scale }],
      opacity: disabled ? 0.42 : variant === 'accent' ? 1 - pressed.value * 0.12 : 1,
    };
    if (variant !== 'plain') {
      base.backgroundColor = interpolateColor(pressed.value, [0, 1], [fill, fillPressed]);
      base.borderColor = interpolateColor(
        pressed.value,
        [0, 1],
        [variant === 'accent' ? palette.accent : palette.line, variant === 'accent' ? palette.accent : palette.lineStrong],
      );
    }
    return base;
  }, [
    disabled,
    fill,
    fillPressed,
    palette.line,
    palette.lineStrong,
    palette.accent,
    reducedMotion,
    variant,
  ]);

  return (
    <AnimatedPressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={
        checked === undefined
          ? { disabled, ...accessibilityState }
          : { disabled, checked, selected: checked, ...accessibilityState }
      }
      aria-checked={checked}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      testID={testID}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
