import { createContext, useContext, useMemo, useState, type ReactNode, type FC } from 'react';

export interface ThemeState {
  sidebarCollapsed: boolean;
  fontSize: 'default' | 'large';
  denseMode: boolean;
}

export interface ThemeStateContextValue {
  state: ThemeState;
  toggleSidebar: () => void;
  setFontSize: (size: 'default' | 'large') => void;
  toggleDenseMode: () => void;
  mode: 'light' | 'dark';
  toggleMode: () => void;
}

export const ThemeStateContext = createContext<ThemeStateContextValue | null>(null);

export const ThemeStateProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [themeState, setThemeState] = useState<ThemeState>({
    sidebarCollapsed: false,
    fontSize: 'default',
    denseMode: false,
  });
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  const value = useMemo<ThemeStateContextValue>(() => ({
    state: themeState,
    mode,
    toggleMode: () => setMode(prev => prev === 'light' ? 'dark' : 'light'),
    toggleSidebar: () => setThemeState(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed })),
    setFontSize: (fontSize) => setThemeState(prev => ({ ...prev, fontSize })),
    toggleDenseMode: () => setThemeState(prev => ({ ...prev, denseMode: !prev.denseMode })),
  }), [themeState, mode]);
  return (
    <ThemeStateContext.Provider value={value}>
      {children}
    </ThemeStateContext.Provider>
  );
};

export function useThemeState(): ThemeStateContextValue {
  const ctx = useContext(ThemeStateContext);
  if (!ctx) throw new Error('useThemeState must be used within ThemeStateProvider');
  return ctx;
}
