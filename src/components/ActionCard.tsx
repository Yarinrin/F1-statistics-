import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { HAIRLINE, RADIUS, SPACE } from '@/theme/tokens';

import { PressableSurface } from './PressableSurface';
import { AccentMark, Chevron } from './primitives';
import { Type } from './Type';

export interface ActionCardProps {
  title: string;
  subtitle?: string;
  /** Small mono note on the metadata line, e.g. the season. */
  meta?: string;
  /** Primary cards carry the red spine. At most one per group. */
  emphasis?: 'primary' | 'default';
  disabled?: boolean;
  /** Replaces the subtitle when disabled — say why, not just "unavailable". */
  disabledNote?: string;
  onPress?: () => void;
  accessibilityHint?: string;
  testID?: string;
}

/**
 * The archive's main action.
 *
 * The title owns a full line so it never has to fight the chevron for room;
 * everything technical — the season, the affordance — sits on the metadata line
 * beneath it. The red spine appears only on the action most people came for.
 */
export function ActionCard({
  title,
  subtitle,
  meta,
  emphasis = 'default',
  disabled = false,
  disabledNote,
  onPress,
  accessibilityHint,
  testID,
}: ActionCardProps) {
  const { palette } = useTheme();
  const isPrimary = emphasis === 'primary' && !disabled;
  const note = disabled ? disabledNote : subtitle;

  return (
    <PressableSurface
      onPress={onPress}
      disabled={disabled}
      haptic={isPrimary}
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      accessibilityHint={disabled ? disabledNote : accessibilityHint}
      testID={testID}
      style={{
        borderRadius: RADIUS.lg,
        borderWidth: HAIRLINE,
        borderColor: palette.line,
        backgroundColor: palette.surface,
        paddingVertical: SPACE.lg + 2,
        paddingHorizontal: SPACE.xl - 4,
        flexDirection: 'row',
        gap: SPACE.md,
      }}
    >
      {isPrimary ? <AccentMark stretch /> : null}
      <View style={{ flex: 1 }}>
        <Type token="title" uppercase numberOfLines={2} style={{ letterSpacing: -0.4 }}>
          {title}
        </Type>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: SPACE.md,
            marginTop: SPACE.sm,
          }}
        >
          {note ? (
            <Type
              token="label"
              color={disabled ? 'faint' : 'muted'}
              uppercase
              numberOfLines={1}
              style={{ flex: 1 }}
            >
              {note}
            </Type>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {meta ? (
            <Type token="micro" color="faint" uppercase>
              {meta}
            </Type>
          ) : null}
          <Chevron color={disabled ? palette.textFaint : palette.textMuted} />
        </View>
      </View>
    </PressableSurface>
  );
}
