import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Platform, ScrollView, Share, View } from 'react-native';

import { ActionCard } from '@/components/ActionCard';
import { AppHeader, HeaderAction, useSafeBack } from '@/components/AppHeader';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import { Rule, SectionLabel } from '@/components/primitives';
import { Type } from '@/components/Type';
import {
  FIRST_CONSTRUCTORS_SEASON,
  hasConstructorsChampionship,
  ordinal,
  parseSeason,
  seasonNumber,
} from '@/domain/seasons';
import { SECTIONS, seasonShareUrl, type ArchiveSection } from '@/domain/wikipedia';
import { useArchive } from '@/state/ArchiveProvider';
import { prefetchSectionAnchor } from '@/state/useSectionAnchor';
import { SPACE } from '@/theme/tokens';

const ORDERED: ArchiveSection[] = ['drivers', 'constructors', 'races', 'season'];

export default function SeasonScreen() {
  const router = useRouter();
  const goBack = useSafeBack();
  const params = useLocalSearchParams<{ year?: string }>();
  const { currentSeason, pinnedSeason, togglePin } = useArchive();

  const year = parseSeason(params.year, currentSeason);

  useEffect(() => {
    if (year === null) return;
    prefetchSectionAnchor(year, 'drivers');
    prefetchSectionAnchor(year, 'constructors');
  }, [year]);

  const openArchive = useCallback(
    (section: ArchiveSection) => {
      if (year === null) return;
      router.push({ pathname: '/archive', params: { year: String(year), section } });
    },
    [router, year],
  );

  const share = useCallback(() => {
    if (year === null) return;
    const url = seasonShareUrl(year);
    Share.share({ message: url, url, title: `${year} Formula One World Championship` }).catch(
      () => {
        /* dismissed, or unsupported — nothing to recover from */
      },
    );
  }, [year]);

  if (year === null) {
    return (
      <Screen edges={['top', 'bottom']}>
        <AppHeader title="Archive" backLabel="Back" />
        <StateView
          title={'Not in\nthe archive'}
          message={`The championship has run every year since 1950. "${params.year ?? ''}" is not one of them.`}
          actionLabel="Browse seasons"
          onAction={() => router.replace('/seasons')}
          secondaryLabel="Go home"
          onSecondary={() => router.replace('/')}
          testID="season-invalid"
        />
      </Screen>
    );
  }

  const isPinned = pinnedSeason === year;
  const constructorsAvailable = hasConstructorsChampionship(year);

  return (
    <Screen edges={['top']}>
      <AppHeader
        title={String(year)}
        backLabel="Back"
        onBack={goBack}
        right={
          <HeaderAction
            label={isPinned ? 'Unpin' : 'Pin'}
            onPress={() => togglePin(year)}
            accessibilityLabel={isPinned ? 'Unpin this season' : 'Pin this season'}
            testID="season-pin"
          />
        }
      />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: SPACE.gutter, paddingBottom: SPACE.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <Reveal index={0}>
          <Type token="hero" weight="bold" allowFontScaling={false} style={{ marginTop: SPACE.lg }}>
            {year}
          </Type>
          <Type token="heading" uppercase style={{ marginTop: SPACE.xs }}>
            Formula One{'\n'}World Championship
          </Type>
          <Rule style={{ marginTop: SPACE.lg }} />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: SPACE.md,
              gap: SPACE.md,
            }}
          >
            <Type token="micro" color="faint" uppercase>
              {`${ordinal(seasonNumber(year))} championship`}
            </Type>
            <Type token="micro" color="faint" uppercase>
              {year === currentSeason ? 'Current season' : isPinned ? 'Pinned' : 'Archive'}
            </Type>
          </View>
        </Reveal>

        <Reveal index={1}>
          <SectionLabel style={{ marginTop: SPACE.xl }}>Standings</SectionLabel>
        </Reveal>

        <View style={{ marginTop: SPACE.md, gap: SPACE.md }}>
          {ORDERED.map((section, index) => {
            const definition = SECTIONS[section];
            const disabled = section === 'constructors' && !constructorsAvailable;
            return (
              <Reveal key={section} index={index + 2}>
                {section === 'races' ? (
                  <SectionLabel style={{ marginBottom: SPACE.md, marginTop: SPACE.sm }}>
                    The article
                  </SectionLabel>
                ) : null}
                <ActionCard
                  title={definition.title}
                  subtitle={definition.subtitle}
                  emphasis={section === 'drivers' ? 'primary' : 'default'}
                  disabled={disabled}
                  disabledNote={`Not awarded until ${FIRST_CONSTRUCTORS_SEASON}`}
                  onPress={() => openArchive(section)}
                  accessibilityHint={`Opens ${definition.target} on Wikipedia`}
                  testID={`season-${section}`}
                />
              </Reveal>
            );
          })}
        </View>

        {Platform.OS === 'web' ? null : (
          <Reveal index={6}>
            <View style={{ marginTop: SPACE.xl, alignItems: 'flex-start' }}>
              <HeaderAction
                label="Share season link"
                onPress={share}
                accessibilityLabel="Share a link to this season"
                testID="season-share"
              />
            </View>
          </Reveal>
        )}

        <Reveal index={7}>
          <Type token="micro" color="faint" uppercase style={{ marginTop: SPACE.xl }}>
            Source · en.wikipedia.org
          </Type>
        </Reveal>
      </ScrollView>
    </Screen>
  );
}
