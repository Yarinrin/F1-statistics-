import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { HAIRLINE, RADIUS, SPACE } from '@/theme/tokens';

import { PressableSurface } from './PressableSurface';
import { AccentMark, Rule } from './primitives';
import { Type } from './Type';

export interface StateViewProps {
  title: string;
  message: string;
  /** Technical detail: the URL that failed, the season that is missing. */
  detail?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  testID?: string;
}

/**
 * Empty, error and dead-end states. Says what happened and offers the way out;
 * the archive does not apologise.
 */
export function StateView({
  title,
  message,
  detail,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  testID,
}: StateViewProps) {
  const { palette } = useTheme();
  return (
    <View
      testID={testID}
      style={{ flex: 1, justifyContent: 'center', paddingHorizontal: SPACE.gutter }}
    >
      <AccentMark height={28} width={4} />
      <Type token="display" uppercase style={{ marginTop: SPACE.lg }}>
        {title}
      </Type>
      <Type token="body" color="muted" style={{ marginTop: SPACE.md, maxWidth: 320 }}>
        {message}
      </Type>

      {detail ? (
        <>
          <Rule style={{ marginTop: SPACE.xl }} />
          <Type token="micro" color="faint" style={{ marginTop: SPACE.md }} numberOfLines={2}>
            {detail}
          </Type>
        </>
      ) : null}

      {actionLabel && onAction ? (
        <PressableSurface
          onPress={onAction}
          haptic
          accessibilityLabel={actionLabel}
          testID="state-action"
          style={{
            marginTop: SPACE.xl,
            alignSelf: 'flex-start',
            borderRadius: RADIUS.pill,
            borderWidth: HAIRLINE,
            borderColor: palette.line,
            backgroundColor: palette.surface,
            paddingVertical: SPACE.md + 2,
            paddingHorizontal: SPACE.xl,
          }}
        >
          <Type token="label" uppercase>
            {actionLabel}
          </Type>
        </PressableSurface>
      ) : null}

      {secondaryLabel && onSecondary ? (
        <PressableSurface
          variant="plain"
          onPress={onSecondary}
          accessibilityLabel={secondaryLabel}
          testID="state-secondary"
          style={{
            marginTop: SPACE.md,
            alignSelf: 'flex-start',
            minHeight: 44,
            justifyContent: 'center',
            paddingHorizontal: SPACE.xs,
          }}
        >
          <Type token="label" color="muted" uppercase>
            {secondaryLabel}
          </Type>
        </PressableSurface>
      ) : null}
    </View>
  );
}
