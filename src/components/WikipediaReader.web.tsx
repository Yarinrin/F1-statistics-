import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { HAIRLINE, RADIUS, SPACE } from '@/theme/tokens';

import { PressableSurface } from './PressableSurface';
import { Rule } from './primitives';
import { Type } from './Type';
import type { WikipediaReaderProps } from './readerTypes';

/**
 * Web build of the reader.
 *
 * The embedded reader is a native-only capability, so on web the archive hands
 * the page over to the browser rather than pretending to embed it.
 */
export function WikipediaReader({
  url,
  anchor,
  onLoadingChange,
  onSectionStatus,
}: WikipediaReaderProps) {
  const { palette } = useTheme();

  useEffect(() => {
    onLoadingChange(false);
    // The address already carries the section, so report it the same way the
    // native reader would once it has scrolled there.
    onSectionStatus(anchor ? 'found' : 'top', null);
  }, [anchor, onLoadingChange, onSectionStatus, url]);

  const open = useCallback(() => {
    WebBrowser.openBrowserAsync(url).catch(() => {
      /* pop-up blocked; the address is on screen either way */
    });
  }, [url]);

  return (
    <View style={{ flex: 1, padding: SPACE.gutter, justifyContent: 'center' }}>
      <View
        style={{
          borderRadius: RADIUS.lg,
          borderWidth: HAIRLINE,
          borderColor: palette.line,
          backgroundColor: palette.surface,
          padding: SPACE.xl,
        }}
      >
        <Type token="micro" color="faint" uppercase>
          Web build
        </Type>
        <Type token="title" uppercase style={{ marginTop: SPACE.md }}>
          Read on Wikipedia
        </Type>
        <Type token="body" color="muted" style={{ marginTop: SPACE.sm }}>
          The embedded reader runs on iOS and Android. Here the archive opens the page in a new
          tab, at the same section.
        </Type>
        <Rule style={{ marginTop: SPACE.lg }} />
        <Type token="micro" color="faint" style={{ marginTop: SPACE.md }} numberOfLines={2}>
          {url}
        </Type>
        <PressableSurface
          onPress={open}
          accessibilityLabel="Open on Wikipedia"
          testID="web-open"
          style={{
            marginTop: SPACE.lg,
            alignSelf: 'flex-start',
            borderRadius: RADIUS.pill,
            borderWidth: HAIRLINE,
            borderColor: palette.line,
            backgroundColor: palette.surface,
            paddingVertical: SPACE.md,
            paddingHorizontal: SPACE.xl,
          }}
        >
          <Type token="label" uppercase>
            Open on Wikipedia
          </Type>
        </PressableSurface>
      </View>
    </View>
  );
}
