import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Platform, View } from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';

import { useTheme } from '@/theme/ThemeProvider';

import type { WikipediaReaderProps } from './readerTypes';
import { buildSectionScript, type SectionStatus } from './sectionScript';

/**
 * The in-app reader.
 *
 * Wikipedia is loaded on its mobile site, then a small script expands and
 * scrolls to the requested section. The script is advisory: if it cannot find
 * the heading the reader still shows the right season page and says so.
 *
 * Every way this view can end up blank — no network, an HTTP error, the
 * platform killing the web content process — is turned into an error the
 * archive screen can offer a way out of. A blank reader is the one outcome
 * that would look broken.
 */
export function WikipediaReader({
  url,
  anchor,
  patterns,
  articleTitle,
  reloadToken,
  onProgress,
  onLoadingChange,
  onError,
  onSectionStatus,
}: WikipediaReaderProps) {
  const { palette } = useTheme();
  const webRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  const script = useMemo(
    () => buildSectionScript({ anchor, patterns, articleTitle }),
    [anchor, patterns, articleTitle],
  );

  // Platform-only props are kept apart on purpose. The native view types
  // several of them per platform, and a prop the other platform declares as a
  // number (decelerationRate) throws ClassCastException on creation if it is
  // handed the string its own wrapper would have converted.
  const platformProps = useMemo(
    () =>
      Platform.select({
        ios: { allowsBackForwardNavigationGestures: true, pullToRefreshEnabled: true },
        // Links that would open a new window have nowhere to go in a reader.
        android: { setSupportMultipleWindows: false },
        default: {},
      }),
    [],
  );

  // Inside the reader the hardware back button walks back through Wikipedia
  // first, and only then closes the reader.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webRef.current) {
        webRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [canGoBack]);

  const handleNavigationStateChange = useCallback((event: WebViewNavigation) => {
    setCanGoBack(event.canGoBack);
  }, []);

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const payload = JSON.parse(event.nativeEvent.data) as {
          type?: string;
          status?: SectionStatus;
          label?: string;
        };
        if (payload?.type === 'section' && payload.status) {
          onSectionStatus(payload.status, payload.label ?? null);
        }
      } catch {
        /* Anything the page posts that we cannot parse is not ours. */
      }
    },
    [onSectionStatus],
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <WebView
        key={reloadToken}
        ref={webRef}
        source={{ uri: url }}
        originWhitelist={['https://*']}
        {...platformProps}
        injectedJavaScript={script}
        onMessage={handleMessage}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={() => {
          onLoadingChange(true);
          onError(null);
        }}
        onLoadProgress={({ nativeEvent }) => onProgress(nativeEvent.progress)}
        onLoadEnd={() => onLoadingChange(false)}
        onError={({ nativeEvent }) => {
          onLoadingChange(false);
          onError({
            kind: 'network',
            detail: nativeEvent.description || 'The connection failed.',
          });
        }}
        onHttpError={({ nativeEvent }) => {
          // Both platforms only report main-frame responses here, so a broken
          // image inside the article cannot take the reader down.
          if (nativeEvent.statusCode < 400) return;
          onLoadingChange(false);
          onError({
            kind: 'http',
            detail: `Wikipedia answered ${nativeEvent.statusCode} ${nativeEvent.description ?? ''}`.trim(),
          });
        }}
        onRenderProcessGone={() => {
          onLoadingChange(false);
          onError({ kind: 'crashed', detail: 'The web view was closed by the system.' });
        }}
        onContentProcessDidTerminate={() => {
          onLoadingChange(false);
          onError({ kind: 'crashed', detail: 'The web view was closed by the system.' });
        }}
        style={{ flex: 1, backgroundColor: palette.bg }}
        containerStyle={{ backgroundColor: palette.bg }}
      />
    </View>
  );
}
