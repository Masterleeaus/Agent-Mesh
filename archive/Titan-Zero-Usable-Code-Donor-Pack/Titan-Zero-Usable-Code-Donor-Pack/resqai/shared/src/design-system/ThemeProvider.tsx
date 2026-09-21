import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode, type FC } from 'react';
import { lightColors, darkColors, lightElevation, darkElevation } from './tokens';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: typeof lightColors;
  elevation: typeof lightElevation;
}

export interface ThemeContextValue {
  theme: Theme;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('resqai-theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

export const ThemeProvider: FC<ThemeProviderProps> = ({ children, defaultMode }) => {
  const [mode, setModeState] = useState<ThemeMode>(defaultMode ?? getInitialMode);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    localStorage.setItem('resqai-theme', next);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('resqai-theme', next);
      return next;
    });
  }, []);

  const theme = useMemo<Theme>(() => ({
    mode,
    colors: mode === 'dark' ? darkColors : lightColors,
    elevation: mode === 'dark' ? darkElevation : lightElevation,
  }), [mode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(() => ({ theme, setMode, toggleMode }), [theme, setMode, toggleMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
