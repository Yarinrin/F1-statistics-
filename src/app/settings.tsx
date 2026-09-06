import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { PressableSurface } from '@/components/PressableSurface';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { AccentMark, Rule, SectionLabel } from '@/components/primitives';
import { Type } from '@/components/Type';
import { useArchive } from '@/state/ArchiveProvider';
import type { ThemeMode } from '@/storage/prefs';
import { useTheme } from '@/theme/ThemeProvider';
import { HAIRLINE, RADIUS, SPACE } from '@/theme/tokens';

const MODES: { value: ThemeMode; label: string; note: string }[] = [
  { value: 'system', label: 'System', note: 'Follows your device' },
  { value: 'light', label: 'Light', note: 'Paper archive' },
  { value: 'dark', label: 'Dark', note: 'Night pit lane' },
];

const LICENCE_URL = 'https://en.wikipedia.org/wiki/Wikipedia:Text_of_the_Creative_Commons_Attribution-ShareAlike_4.0_International_License';

function OptionRow({
  label,
  note,
  selected,
  isLast,
  onPress,
  testID,
}: {
  label: string;
  note: string;
  selected: boolean;
  isLast: boolean;
  onPress: () => void;
  testID: string;
}) {
  const { palette } = useTheme();
  return (
    <View>
      <PressableSurface
        variant="plain"
        onPress={onPress}
        haptic
        accessibilityLabel={label}
        accessibilityHint={note}
        accessibilityRole="radio"
        checked={selected}
        testID={testID}
        style={{
          minHeight: 58,
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACE.md,
          paddingHorizontal: SPACE.lg + 2,
        }}
      >
        <View style={{ flex: 1 }}>
          <Type token="heading" weight="semibold" uppercase style={{ letterSpacing: 0.2 }}>
            {label}
          </Type>
          <Type token="micro" color="faint" uppercase style={{ marginTop: 3 }}>
            {note}
          </Type>
        </View>
        {selected ? (
          <AccentMark height={16} width={16} />
        ) : (
          <View
            style={{
              width: 16,
              height: 16,
              borderRadius: 8,
              borderWidth: HAIRLINE,
              borderColor: palette.lineStrong,
            }}
          />
        )}
      </PressableSurface>
      {isLast ? null : <Rule style={{ marginHorizontal: SPACE.lg + 2 }} />}
    </View>
  );
}

export default function SettingsScreen() {
  const { palette, mode, setMode } = useTheme();
  const { recents, pinnedSeason, clearRecents, togglePin } = useArchive();

  const version = Constants.expoConfig?.version ?? '1.0.0';

  const cardStyle = {
    marginTop: SPACE.md,
    borderRadius: RADIUS.lg,
    borderWidth: HAIRLINE,
    borderColor: palette.line,
    backgroundColor: palette.surface,
    overflow: 'hidden' as const,
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <AppHeader title="Settings" backLabel="Close" />
      <View style={{ flex: 1, paddingHorizontal: SPACE.gutter }}>
        <Reveal index={0}>
          <Type token="display" uppercase style={{ marginTop: SPACE.xl }}>
            Settings
          </Type>
        </Reveal>

        <Reveal index={1}>
          <SectionLabel style={{ marginTop: SPACE.xl }}>Appearance</SectionLabel>
          <View style={cardStyle} accessibilityRole="radiogroup" accessibilityLabel="Appearance">
            {MODES.map((option, index) => (
              <OptionRow
                key={option.value}
                label={option.label}
                note={option.note}
                selected={mode === option.value}
                isLast={index === MODES.length - 1}
                onPress={() => setMode(option.value)}
                testID={`theme-${option.value}`}
              />
            ))}
          </View>
        </Reveal>

        <Reveal index={2}>
          <SectionLabel style={{ marginTop: SPACE.xxl }}>Archive</SectionLabel>
          <View style={cardStyle}>
            <PressableSurface
              variant="plain"
              onPress={clearRecents}
              disabled={recents.length === 0}
              accessibilityLabel="Clear recently viewed"
              testID="clear-recents"
              style={{
                minHeight: 58,
                justifyContent: 'center',
                paddingHorizontal: SPACE.lg + 2,
              }}
            >
              <Type token="heading" weight="semibold" uppercase style={{ letterSpacing: 0.2 }}>
                Clear recently viewed
              </Type>
              <Type token="micro" color="faint" uppercase style={{ marginTop: 3 }}>
                {recents.length === 0 ? 'Nothing stored' : `${recents.length} stored`}
              </Type>
            </PressableSurface>
            <Rule style={{ marginHorizontal: SPACE.lg + 2 }} />
            <PressableSurface
              variant="plain"
              onPress={() => pinnedSeason !== null && togglePin(pinnedSeason)}
              disabled={pinnedSeason === null}
              accessibilityLabel="Remove pinned season"
              testID="clear-pinned"
              style={{
                minHeight: 58,
                justifyContent: 'center',
                paddingHorizontal: SPACE.lg + 2,
              }}
            >
              <Type token="heading" weight="semibold" uppercase style={{ letterSpacing: 0.2 }}>
                Remove pinned season
              </Type>
              <Type token="micro" color="faint" uppercase style={{ marginTop: 3 }}>
                {pinnedSeason === null ? 'No season pinned' : `${pinnedSeason} pinned`}
              </Type>
            </PressableSurface>
          </View>
        </Reveal>

        <Reveal index={3} style={{ marginTop: 'auto' }}>
          <Rule style={{ marginTop: SPACE.xxl }} />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: SPACE.md,
              marginBottom: SPACE.lg,
              gap: SPACE.md,
            }}
          >
            <Type token="micro" color="faint" uppercase style={{ flex: 1 }}>
              Apex {version} · Standings from Wikipedia
            </Type>
            <PressableSurface
              variant="plain"
              onPress={() => {
                WebBrowser.openBrowserAsync(LICENCE_URL).catch(() => {
                  /* the licence link is informational */
                });
              }}
              accessibilityLabel="Read the CC BY-SA licence"
              testID="settings-licence"
              style={{ minHeight: 32, justifyContent: 'center' }}
            >
              <Type token="micro" color="muted" uppercase>
                CC BY-SA
              </Type>
            </PressableSurface>
          </View>
        </Reveal>
      </View>
    </Screen>
  );
}
