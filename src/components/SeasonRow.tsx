import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { HAIRLINE, RADIUS, SPACE } from '@/theme/tokens';

import { PressableSurface } from './PressableSurface';
import { AccentMark, Badge, Chevron, Rule } from './primitives';
import { Type } from './Type';

export interface SeasonRowProps {
  year: number;
  isCurrent?: boolean;
  isPinned?: boolean;
  /** True for the last row of a decade card, which drops its rule. */
  isLast?: boolean;
  onPress: () => void;
}

/** One year in the archive index. Dense on purpose: the year does the work. */
export function SeasonRow({ year, isCurrent, isPinned, isLast, onPress }: SeasonRowProps) {
  const { palette } = useTheme();
  const labels = [isCurrent ? 'current season' : null, isPinned ? 'pinned' : null].filter(Boolean);

  return (
    <View>
      <PressableSurface
        variant="plain"
        onPress={onPress}
        accessibilityLabel={`${year} season${labels.length ? `, ${labels.join(', ')}` : ''}`}
        accessibilityHint="Opens the season"
        testID={`season-row-${year}`}
        style={{
          minHeight: 58,
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACE.md,
          paddingHorizontal: SPACE.lg + 2,
        }}
      >
        {isCurrent ? <AccentMark height={24} /> : null}
        <Type token="year" weight={isCurrent ? 'bold' : 'semibold'} style={{ flex: 1 }}>
          {year}
        </Type>
        {isCurrent ? <Badge label="Current" /> : null}
        {isPinned && !isCurrent ? <Badge label="Pinned" tone="neutral" /> : null}
        <Chevron color={palette.textFaint} />
      </PressableSurface>
      {isLast ? null : <Rule style={{ marginHorizontal: SPACE.lg + 2 }} />}
    </View>
  );
}

export interface FeaturedSeasonProps {
  year: number;
  label: string;
  emphasis?: 'primary' | 'default';
  onPress: () => void;
  testID?: string;
}

/** A season lifted out of the index: the current one, or the pinned one. */
export function FeaturedSeasonCard({
  year,
  label,
  emphasis = 'default',
  onPress,
  testID,
}: FeaturedSeasonProps) {
  const { palette } = useTheme();
  const isPrimary = emphasis === 'primary';
  return (
    <PressableSurface
      onPress={onPress}
      haptic={isPrimary}
      accessibilityLabel={`${year}, ${label}`}
      accessibilityHint="Opens the season"
      testID={testID}
      style={{
        borderRadius: RADIUS.lg,
        borderWidth: HAIRLINE,
        borderColor: palette.line,
        backgroundColor: palette.surface,
        paddingVertical: SPACE.lg,
        paddingHorizontal: SPACE.xl - 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACE.lg,
      }}
    >
      {isPrimary ? <AccentMark height={38} width={4} /> : null}
      <View style={{ flex: 1 }}>
        <Type token="year" weight="bold">
          {year}
        </Type>
        <Type token="micro" color={isPrimary ? 'accent' : 'faint'} uppercase style={{ marginTop: 4 }}>
          {label}
        </Type>
      </View>
      <Chevron color={palette.textMuted} size={10} />
    </PressableSurface>
  );
}
