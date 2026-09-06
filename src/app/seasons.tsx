import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { FlatList, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { FeaturedSeasonCard, SeasonRow } from '@/components/SeasonRow';
import { SectionLabel } from '@/components/primitives';
import { Type } from '@/components/Type';
import { FIRST_SEASON, groupSeasonsByDecade, listSeasons, seasonNumber } from '@/domain/seasons';
import { useArchive } from '@/state/ArchiveProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { HAIRLINE, RADIUS, SPACE } from '@/theme/tokens';

export default function SeasonsScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const { currentSeason, pinnedSeason } = useArchive();

  const decades = useMemo(
    () => groupSeasonsByDecade(listSeasons(currentSeason)),
    [currentSeason],
  );

  const openSeason = useCallback(
    (year: number) => {
      router.push({ pathname: '/season/[year]', params: { year: String(year) } });
    },
    [router],
  );

  return (
    <Screen edges={['top']}>
      <AppHeader title="Archive" backLabel="Home" />
      <FlatList
        data={decades}
        keyExtractor={(item) => String(item.decade)}
        contentContainerStyle={{
          paddingHorizontal: SPACE.gutter,
          paddingBottom: SPACE.xxxl,
        }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={11}
        removeClippedSubviews={false}
        ListHeaderComponent={
          <View>
            <Reveal index={0}>
              <Type token="display" uppercase style={{ marginTop: SPACE.xl }}>
                Seasons
              </Type>
              <Type token="micro" color="faint" uppercase style={{ marginTop: SPACE.sm }}>
                {`${FIRST_SEASON}—${currentSeason} · ${seasonNumber(currentSeason)} championships`}
              </Type>
            </Reveal>

            <Reveal index={1}>
              <View style={{ marginTop: SPACE.xl, gap: SPACE.md }}>
                <FeaturedSeasonCard
                  year={currentSeason}
                  label="Current season"
                  emphasis="primary"
                  onPress={() => openSeason(currentSeason)}
                  testID="seasons-current"
                />
                {pinnedSeason !== null && pinnedSeason !== currentSeason ? (
                  <FeaturedSeasonCard
                    year={pinnedSeason}
                    label="Pinned season"
                    onPress={() => openSeason(pinnedSeason)}
                    testID="seasons-pinned"
                  />
                ) : null}
              </View>
            </Reveal>
          </View>
        }
        renderItem={({ item, index }) => (
          <Reveal index={Math.min(index + 2, 5)}>
            <SectionLabel
              meta={`${item.data.length}`}
              uppercase={false}
              style={{ marginTop: index === 0 ? SPACE.xxl : SPACE.xl }}
            >
              {item.title}
            </SectionLabel>
            <View
              style={{
                marginTop: SPACE.md,
                borderRadius: RADIUS.lg,
                borderWidth: HAIRLINE,
                borderColor: palette.line,
                backgroundColor: palette.surface,
                overflow: 'hidden',
              }}
            >
              {item.data.map((year, rowIndex) => (
                <SeasonRow
                  key={year}
                  year={year}
                  isCurrent={year === currentSeason}
                  isPinned={year === pinnedSeason}
                  isLast={rowIndex === item.data.length - 1}
                  onPress={() => openSeason(year)}
                />
              ))}
            </View>
          </Reveal>
        )}
      />
    </Screen>
  );
}
