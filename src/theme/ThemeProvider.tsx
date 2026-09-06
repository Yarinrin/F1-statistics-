import { Archivo_400Regular } from '@expo-google-fonts/archivo/400Regular';
import { Archivo_500Medium } from '@expo-google-fonts/archivo/500Medium';
import { Archivo_600SemiBold } from '@expo-google-fonts/archivo/600SemiBold';
import { Archivo_700Bold } from '@expo-google-fonts/archivo/700Bold';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono/400Regular';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono/500Medium';
import { useFonts } from 'expo-font';
import * as SystemUI from 'expo-system-ui';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, useColorScheme, View, type TextStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { loadThemeMode, saveThemeMode, type ThemeMode } from '@/storage/prefs';

import { TIMING } from './motion';
import { DURATION, PALETTES, type ColorScheme, type Palette, type TypeToken } from './tokens';
import { fontStyle, textStyle, type FontRole, type TextTokenOptions } from './typography';

export interface ThemeValue {
  mode: ThemeMode;
  scheme: ColorScheme;
  palette: Palette;
  fontsReady: boolean;
  reducedMotion: boolean;
  setMode: (mode: ThemeMode) => void;
  /** Type token -> style. `t('label', { uppercase: true })` */
  t: (token: TypeToken, options?: TextTokenOptions) => TextStyle;
  font: (role: FontRole) => TextStyle;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside <ThemeProvider>');
  return value;
}

/** Safety net so a font hiccup can never hold the splash screen hostage. */
const FONT_TIMEOUT_MS = 2500;

export function ThemeProvider({
  children,
  onReady,
}: {
  children: ReactNode;
  onReady?: () => void;
}) {
  const systemScheme = useColorScheme();
  const reducedMotion = useReducedMotion();

  const [mode, setModeState] = useState<ThemeMode>('system');
  const [prefsReady, setPrefsReady] = useState(false);
  const [fontTimedOut, setFontTimedOut] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    let cancelled = false;
    loadThemeMode().then((stored) => {
      if (cancelled) return;
      setModeState(stored);
      setPrefsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setFontTimedOut(true), FONT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  const fontsReady = fontsLoaded && !fontError;
  const fontsSettled = fontsLoaded || !!fontError || fontTimedOut;
  const ready = prefsReady && fontsSettled;

  const scheme: ColorScheme =
    mode === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : mode;
  const palette = PALETTES[scheme];

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void saveThemeMode(next);
  }, []);

  // Keep the window behind the React tree in the theme colour so screen
  // transitions never flash the opposite theme.
  useEffect(() => {
    if (!ready) return;
    SystemUI.setBackgroundColorAsync(palette.bg).catch(() => {
      /* purely cosmetic */
    });
  }, [palette.bg, ready]);

  const readyFiredRef = useRef(false);
  useEffect(() => {
    if (ready && !readyFiredRef.current) {
      readyFiredRef.current = true;
      onReady?.();
    }
  }, [ready, onReady]);

  const value = useMemo<ThemeValue>(
    () => ({
      mode,
      scheme,
      palette,
      fontsReady,
      reducedMotion,
      setMode,
      t: (token, options) => textStyle(token, fontsReady, options),
      font: (role) => fontStyle(role, fontsReady),
    }),
    [mode, scheme, palette, fontsReady, reducedMotion, setMode],
  );

  if (!ready) {
    // Rendered under the splash screen; matches it so the handover is invisible.
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.bg }]} />;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Cross-dissolve between themes.
 *
 * The new theme renders immediately underneath; this paints the *previous*
 * ground on top and fades it away, so text never sits on the wrong background
 * mid-transition. The overlay unmounts on a plain timer, so even if the
 * animation never runs it cannot get stuck.
 */
export function ThemeTransition() {
  const { palette, reducedMotion } = useTheme();
  const previousRef = useRef<string>(palette.bg);
  const [fadingFrom, setFadingFrom] = useState<string | null>(null);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const previous = previousRef.current;
    if (previous === palette.bg) return;
    previousRef.current = palette.bg;
    if (reducedMotion) return;
    setFadingFrom(previous);
    const timer = setTimeout(() => setFadingFrom(null), DURATION.slow + 80);
    return () => clearTimeout(timer);
  }, [palette.bg, reducedMotion]);

  useEffect(() => {
    if (!fadingFrom) return;
    opacity.value = 1;
    opacity.value = withTiming(0, TIMING.slow);
  }, [fadingFrom, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!fadingFrom) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: fadingFrom }, style]}
    />
  );
}
