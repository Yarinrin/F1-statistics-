import { useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { ScrollView, View } from 'react-native';

import { ActionCard } from '@/components/ActionCard';
import { HeaderAction } from '@/components/AppHeader';
import { PressableSurface } from '@/components/PressableSurface';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { FeaturedSeasonCard } from '@/components/SeasonRow';
import { Chevron, Rule, SectionLabel } from '@/components/primitives';
import { Type } from '@/components/Type';
import {
  FIRST_CONSTRUCTORS_SEASON,
  FIRST_SEASON,
  hasConstructorsChampionship,
  ordinal,
  seasonNumber,
} from '@/domain/seasons';
import { SECTIONS, type ArchiveSection } from '@/domain/wikipedia';
import { useArchive } from '@/state/ArchiveProvider';
import { prefetchSectionAnchor } from '@/state/useSectionAnchor';
import { useTheme } from '@/theme/ThemeProvider';
import { HAIRLINE, RADIUS, SPACE } from '@/theme/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const { currentSeason, recents, pinnedSeason } = useArchive();

  const seasonCount = seasonNumber(currentSeason);
  const constructorsAvailable = hasConstructorsChampionship(currentSeason);

  // Warm the two lookups almost every session starts with, so the reader opens
  // straight onto the standings instead of hunting for them.
  useEffect(() => {
    prefetchSectionAnchor(currentSeason, 'drivers');
    prefetchSectionAnchor(currentSeason, 'constructors');
  }, [currentSeason]);

  const openArchive = useCallback(
    (year: number, section: ArchiveSection) => {
      router.push({ pathname: '/archive', params: { year: String(year), section } });
    },
    [router],
  );

  const openSeason = useCallback(
    (year: number) => {
      router.push({ pathname: '/season/[year]', params: { year: String(year) } });
    },
    [router],
  );

  return (
    <Screen edges={['top']}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SPACE.gutter,
          paddingBottom: SPACE.xxxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Masthead */}
        <Reveal index={0}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: SPACE.lg,
              gap: SPACE.lg,
            }}
          >
            <Type token="title" weight="bold" style={{ letterSpacing: 2 }}>
              APEX
            </Type>
            <HeaderAction
              label="Settings"
              onPress={() => router.push('/settings')}
              testID="home-settings"
            />
          </View>
          <Type token="micro" color="faint" uppercase style={{ marginTop: SPACE.sm }}>
            Formula One statistics archive
          </Type>
        </Reveal>

        <Reveal index={1}>
          <Rule strong style={{ marginTop: SPACE.lg }} />
        </Reveal>

        {/* Current season — the hero, and the fastest route in */}
        <Reveal index={2}>
          <SectionLabel meta={`${ordinal(seasonCount)} season`} style={{ marginTop: SPACE.xl }}>
            Current season
          </SectionLabel>
          <PressableSurface
            variant="plain"
            onPress={() => openSeason(currentSeason)}
            accessibilityLabel={`${currentSeason} season overview`}
            accessibilityHint="Opens the season"
            testID="home-current-season"
            style={{ paddingTop: SPACE.md, paddingBottom: SPACE.sm }}
          >
            <Type token="hero" weight="bold" allowFontScaling={false}>
              {currentSeason}
            </Type>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACE.sm }}>
              <Type token="micro" color="muted" uppercase>
                Formula One World Championship
              </Type>
              <Chevron size={7} color={palette.textFaint} />
            </View>
          </PressableSurface>
        </Reveal>

        {/* Two taps, at most, to any standings table */}
        <Reveal index={3}>
          <View style={{ marginTop: SPACE.xl, gap: SPACE.md }}>
            <ActionCard
              title={SECTIONS.drivers.title}
              subtitle={SECTIONS.drivers.subtitle}
              meta={String(currentSeason)}
              emphasis="primary"
              onPress={() => openArchive(currentSeason, 'drivers')}
              accessibilityHint="Opens the drivers' standings"
              testID="home-drivers"
            />
            <ActionCard
              title={SECTIONS.constructors.title}
              subtitle={SECTIONS.constructors.subtitle}
              meta={String(currentSeason)}
              disabled={!constructorsAvailable}
              disabledNote={`No constructors' title before ${FIRST_CONSTRUCTORS_SEASON}`}
              onPress={() => openArchive(currentSeason, 'constructors')}
              accessibilityHint="Opens the constructors' standings"
              testID="home-constructors"
            />
          </View>
        </Reveal>

        {/* The rest of the archive */}
        <Reveal index={4}>
          <SectionLabel
            meta={`${FIRST_SEASON}—${currentSeason}`}
            style={{ marginTop: SPACE.xxl }}
          >
            Archive
          </SectionLabel>
          <View style={{ marginTop: SPACE.md, gap: SPACE.md }}>
            <ActionCard
              title="Browse seasons"
              subtitle={`${seasonCount} seasons`}
              onPress={() => router.push('/seasons')}
              accessibilityHint="Opens the season index"
              testID="home-browse"
            />
            {pinnedSeason !== null && pinnedSeason !== currentSeason ? (
              <FeaturedSeasonCard
                year={pinnedSeason}
                label="Pinned season"
                onPress={() => openSeason(pinnedSeason)}
                testID="home-pinned"
              />
            ) : null}
          </View>
        </Reveal>

        {recents.length > 0 ? (
          <Reveal index={5}>
            <SectionLabel style={{ marginTop: SPACE.xxl }}>Recently viewed</SectionLabel>
            <View
              style={{
                marginTop: SPACE.md,
                borderRadius: RADIUS.lg,
                borderWidth: HAIRLINE,
                borderColor: palette.line,
                overflow: 'hidden',
              }}
            >
              {recents.map((entry, index) => (
                <View key={`${entry.year}-${entry.section}`}>
                  <PressableSurface
                    variant="plain"
                    onPress={() => openArchive(entry.year, entry.section)}
                    accessibilityLabel={`${entry.year} ${SECTIONS[entry.section].title}`}
                    accessibilityHint="Reopens this page of the archive"
                    testID={`home-recent-${entry.year}-${entry.section}`}
                    style={{
                      minHeight: 52,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: SPACE.md,
                      paddingHorizontal: SPACE.lg + 2,
                    }}
                  >
                    <Type token="heading" weight="semibold" style={{ width: 58 }}>
                      {entry.year}
                    </Type>
                    <Type token="label" color="muted" uppercase style={{ flex: 1 }}>
                      {SECTIONS[entry.section].title}
                    </Type>
                    <Chevron color={palette.textFaint} />
                  </PressableSurface>
                  {index === recents.length - 1 ? null : (
                    <Rule style={{ marginHorizontal: SPACE.lg + 2 }} />
                  )}
                </View>
              ))}
            </View>
          </Reveal>
        ) : null}

        <Reveal index={6}>
          <Type token="micro" color="faint" uppercase style={{ marginTop: SPACE.xxl }}>
            Source · en.wikipedia.org
          </Type>
        </Reveal>
      </ScrollView>
    </Screen>
  );
}
