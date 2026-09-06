import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ArchiveProvider } from '@/state/ArchiveProvider';
import { ThemeProvider, ThemeTransition, useTheme } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* Already hidden, or unsupported on this platform. */
});

function RootStack() {
  const { palette } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: palette.bg },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="seasons" />
      <Stack.Screen name="season/[year]" />
      <Stack.Screen name="settings" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="archive" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const handleReady = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {
      /* no-op */
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider onReady={handleReady}>
          <ArchiveProvider>
            <RootStack />
            <ThemeTransition />
          </ArchiveProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
