import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppHeader, HeaderAction, useSafeBack } from '@/components/AppHeader';
import { ReaderPlaceholder } from '@/components/ReaderPlaceholder';
import { ReaderProgress } from '@/components/ReaderProgress';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import { WikipediaReader } from '@/components/WikipediaReader';
import { Rule } from '@/components/primitives';
import type { ReaderError } from '@/components/readerTypes';
import type { SectionStatus } from '@/components/sectionScript';
import { Type } from '@/components/Type';
import { hasConstructorsChampionship, parseSeason } from '@/domain/seasons';
import {
  SECTIONS,
  parseArchiveSection,
  seasonArticleTitle,
  seasonArticleUrl,
  seasonShareUrl,
} from '@/domain/wikipedia';
import { useArchive } from '@/state/ArchiveProvider';
import { useSectionAnchor } from '@/state/useSectionAnchor';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACE } from '@/theme/tokens';

/** One honest sentence per way the reader can come up empty. */
/** The placeholder never outlives this, whatever the web view reports. */
const LOADING_CEILING_MS = 12000;

const READER_ERRORS: Record<ReaderError['kind'], { title: string; message: string }> = {
  network: {
    title: 'Connection\nlost',
    message: 'Unable to reach the archive. Check your connection and try again.',
  },
  http: {
    title: 'Page\nunavailable',
    message: 'Wikipedia could not serve this page. It may have been renamed or moved.',
  },
  crashed: {
    title: 'Reader\nstopped',
    message: 'The system closed the reader, usually to free memory. Reloading normally fixes it.',
  },
};

export default function ArchiveScreen() {
  const router = useRouter();
  const goBack = useSafeBack();
  const { palette } = useTheme();
  const { currentSeason, recordVisit } = useArchive();
  const params = useLocalSearchParams<{ year?: string; section?: string }>();

  const year = parseSeason(params.year, currentSeason);
  const section = parseArchiveSection(params.section) ?? 'season';

  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ReaderError | null>(null);
  const [status, setStatus] = useState<SectionStatus | null>(null);
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const { anchor, line } = useSectionAnchor(year ?? currentSeason, section);

  // However the load ends — silently, or not at all — the placeholder goes.
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), LOADING_CEILING_MS);
    return () => clearTimeout(timer);
  }, [loading, reloadToken]);

  // The address is fixed at mount: a late anchor must never reload the page
  // out from under someone who is already reading it.
  const initialAnchorRef = useRef<string | null | undefined>(undefined);
  if (initialAnchorRef.current === undefined) initialAnchorRef.current = anchor;

  useEffect(() => {
    if (year !== null) recordVisit(year, section);
  }, [year, section, recordVisit]);

  const definition = SECTIONS[section];

  const readerUrl = useMemo(
    () =>
      year === null
        ? ''
        : seasonArticleUrl(year, { mobile: true, anchor: initialAnchorRef.current }),
    [year],
  );

  const openExternally = useCallback(() => {
    if (year === null) return;
    WebBrowser.openBrowserAsync(seasonShareUrl(year, anchor)).catch(() => {
      /* No browser available; the reader is still on screen. */
    });
  }, [year, anchor]);

  const retry = useCallback(() => {
    setError(null);
    setStatus(null);
    setStatusLabel(null);
    setProgress(0);
    setLoading(true);
    setReloadToken((token) => token + 1);
  }, []);

  const handleSectionStatus = useCallback((next: SectionStatus, label: string | null) => {
    setStatus(next);
    setStatusLabel(label);
  }, []);

  if (year === null) {
    return (
      <Screen edges={['top', 'bottom']}>
        <AppHeader title="Archive" backLabel="Close" />
        <StateView
          title={'Not in\nthe archive'}
          message="That season is not part of the Formula One World Championship."
          actionLabel="Browse seasons"
          onAction={() => router.replace('/seasons')}
          testID="archive-invalid-season"
        />
      </Screen>
    );
  }

  if (section === 'constructors' && !hasConstructorsChampionship(year)) {
    return (
      <Screen edges={['top', 'bottom']}>
        <AppHeader title={String(year)} backLabel="Close" onBack={goBack} />
        <StateView
          title={'No\nconstructors'}
          message={`The World Constructors' Championship was first awarded in 1958, so ${year} has no constructors' table.`}
          actionLabel={`Open ${year} drivers`}
          onAction={() =>
            router.replace({
              pathname: '/archive',
              params: { year: String(year), section: 'drivers' },
            })
          }
          secondaryLabel="Back to season"
          onSecondary={goBack}
          testID="archive-no-constructors"
        />
      </Screen>
    );
  }

  // What the strip under the header says, in plain terms.
  const sectionNote =
    error !== null
      ? null
      : status === 'found'
        ? statusLabel || line || definition.target
        : status === 'missing' || status === 'error'
          ? 'Section not found — showing the full season page'
          : status === 'offpage'
            ? 'Browsing Wikipedia'
            : status === 'top'
              ? 'Full season article'
              : loading
                ? `Locating ${definition.target}`
                : definition.target;

  return (
    <Screen edges={['top', 'bottom']}>
      <AppHeader
        title={`${year} · ${definition.title}`}
        backLabel="Close"
        onBack={goBack}
        divider={false}
        right={
          <HeaderAction
            label="Open"
            onPress={openExternally}
            accessibilityLabel="Open in the browser"
            testID="archive-open-external"
          />
        }
      />

      <ReaderProgress progress={progress} loading={loading} visible={error === null} />

      {sectionNote ? (
        <View style={{ paddingHorizontal: SPACE.gutter, paddingBottom: SPACE.sm }}>
          <Type
            token="micro"
            color={status === 'missing' || status === 'error' ? 'accent' : 'faint'}
            uppercase
            numberOfLines={1}
            accessibilityLiveRegion="polite"
          >
            {sectionNote}
          </Type>
        </View>
      ) : null}
      <Rule />

      {error !== null ? (
        <StateView
          title={READER_ERRORS[error.kind].title}
          message={READER_ERRORS[error.kind].message}
          detail={error.detail}
          actionLabel="Try again"
          onAction={retry}
          secondaryLabel="Open in browser"
          onSecondary={openExternally}
          testID="archive-error"
        />
      ) : (
        <View style={{ flex: 1, backgroundColor: palette.bg }}>
          <WikipediaReader
            url={readerUrl}
            anchor={anchor}
            patterns={definition.headingPatterns}
            articleTitle={seasonArticleTitle(year)}
            reloadToken={reloadToken}
            onProgress={setProgress}
            onLoadingChange={setLoading}
            onError={setError}
            onSectionStatus={handleSectionStatus}
          />
          {loading ? (
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { backgroundColor: palette.bg }]}
            >
              <ReaderPlaceholder label={`Opening ${year} · ${definition.title}`} />
            </View>
          ) : null}
        </View>
      )}
    </Screen>
  );
}
