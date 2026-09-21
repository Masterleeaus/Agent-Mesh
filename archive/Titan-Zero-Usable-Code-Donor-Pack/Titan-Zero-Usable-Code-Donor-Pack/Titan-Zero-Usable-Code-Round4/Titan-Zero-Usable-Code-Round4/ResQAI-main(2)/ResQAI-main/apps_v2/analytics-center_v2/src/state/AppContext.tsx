import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { DateRangePreset } from '../models/dto';

export interface AppState {
  currentUser: { id: string; name: string; role: string } | null;
  dateRange: { preset: DateRangePreset; startDate?: string; endDate?: string };
  activeDomain: string | null;
  reportEditing: { reportId: string | null; isDirty: boolean };
}

export interface AppContextValue {
  state: AppState;
  setCurrentUser: (user: AppState['currentUser']) => void;
  setDateRange: (range: AppState['dateRange']) => void;
  setActiveDomain: (domain: string | null) => void;
  setReportEditing: (editing: AppState['reportEditing']) => void;
  resetState: () => void;
}

const defaultState: AppState = {
  currentUser: null,
  dateRange: { preset: 'last30Days' as DateRangePreset },
  activeDomain: null,
  reportEditing: { reportId: null, isDirty: false },
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);

  const setCurrentUser = useCallback((currentUser: AppState['currentUser']) => {
    setState((prev) => ({ ...prev, currentUser }));
  }, []);

  const setDateRange = useCallback((dateRange: AppState['dateRange']) => {
    setState((prev) => ({ ...prev, dateRange }));
  }, []);

  const setActiveDomain = useCallback((activeDomain: string | null) => {
    setState((prev) => ({ ...prev, activeDomain }));
  }, []);

  const setReportEditing = useCallback((reportEditing: AppState['reportEditing']) => {
    setState((prev) => ({ ...prev, reportEditing }));
  }, []);

  const resetState = useCallback(() => {
    setState(defaultState);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({ state, setCurrentUser, setDateRange, setActiveDomain, setReportEditing, resetState }),
    [state, setCurrentUser, setDateRange, setActiveDomain, setReportEditing, resetState],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within an AppProvider');
  return ctx;
}
