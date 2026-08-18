import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Archivo_400Regular, Archivo_600SemiBold, Archivo_800ExtraBold } from '@expo-google-fonts/archivo';
import { lightColors, darkColors, typography, spacing, radii, shadows, sizes } from '../theme';
import { STORAGE_PREFIX } from '../lib/constants';

const STORAGE_KEY = `${STORAGE_PREFIX}theme`;

const ThemeContext = createContext(null);

/**
 * Fournit les tokens du design system. `mode` vaut 'system' | 'light' | 'dark'
 * et est persisté — §3.5 (dark mode, checklist Phase 2).
 */
export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState('system');
  const [ready, setReady] = useState(false);
  // Archivo (piste Modernist) : chargée ici plutôt qu'à la racine d'App.js,
  // qu'on ne modifie jamais (§ règles absolues). Tant qu'elle n'est pas prête,
  // le fournisseur ne rend rien — même garde que pour `ready` ci-dessous.
  const [fontsReady] = useFonts({ Archivo_400Regular, Archivo_600SemiBold, Archivo_800ExtraBold });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') setMode(saved);
      })
      .finally(() => setReady(true));
  }, []);

  const setThemeMode = useCallback((next) => {
    setMode(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo(() => {
    const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
    return {
      isDark,
      mode,
      setThemeMode,
      colors: isDark ? darkColors : lightColors,
      typography,
      spacing,
      radii,
      shadows,
      sizes,
    };
  }, [mode, systemScheme, setThemeMode]);

  if (!ready || !fontsReady) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme doit être utilisé dans un ThemeProvider');
  return ctx;
}
