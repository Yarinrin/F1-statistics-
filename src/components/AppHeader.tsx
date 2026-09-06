import { useRouter } from 'expo-router';
import { useCallback, type ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { HAIRLINE, RADIUS, SPACE, TOUCH_TARGET } from '@/theme/tokens';

import { PressableSurface } from './PressableSurface';
import { Chevron, Rule } from './primitives';
import { Type } from './Type';

/** Back that still works when the screen was opened from a cold deep link. */
export function useSafeBack(fallback: '/' = '/') {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback);
  }, [router, fallback]);
}

export function HeaderAction({
  label,
  onPress,
  accessibilityLabel,
  testID,
}: {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
}) {
  const { palette } = useTheme();
  return (
    <PressableSurface
      variant="plain"
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
      style={{
        minHeight: 34,
        justifyContent: 'center',
        paddingHorizontal: SPACE.md,
        borderRadius: RADIUS.pill,
        borderWidth: HAIRLINE,
        borderColor: palette.line,
      }}
    >
      <Type token="micro" color="muted" uppercase>
        {label}
      </Type>
    </PressableSurface>
  );
}

export interface AppHeaderProps {
  /** Centre label. Keep it to one or two words. */
  title?: string;
  backLabel?: string;
  onBack?: () => void;
  right?: ReactNode;
  divider?: boolean;
  testID?: string;
}

export function AppHeader({
  title,
  backLabel = 'Back',
  onBack,
  right,
  divider = true,
  testID,
}: AppHeaderProps) {
  const { palette } = useTheme();
  const safeBack = useSafeBack();
  const handleBack = onBack ?? safeBack;

  return (
    <View testID={testID}>
      <View
        style={{
          minHeight: TOUCH_TARGET,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: SPACE.gutter,
          paddingVertical: SPACE.sm,
          gap: SPACE.md,
        }}
      >
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <PressableSurface
            variant="plain"
            onPress={handleBack}
            accessibilityLabel={backLabel}
            testID="header-back"
            style={{
              minHeight: TOUCH_TARGET,
              justifyContent: 'center',
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACE.sm,
              paddingRight: SPACE.md,
            }}
          >
            <Chevron direction="left" color={palette.textMuted} size={8} />
            <Type token="micro" color="muted" uppercase>
              {backLabel}
            </Type>
          </PressableSurface>
        </View>

        {title ? (
          <Type token="micro" color="faint" uppercase accessibilityRole="header">
            {title}
          </Type>
        ) : null}

        <View style={{ flex: 1, alignItems: 'flex-end' }}>{right}</View>
      </View>
      {divider ? <Rule /> : null}
    </View>
  );
}
