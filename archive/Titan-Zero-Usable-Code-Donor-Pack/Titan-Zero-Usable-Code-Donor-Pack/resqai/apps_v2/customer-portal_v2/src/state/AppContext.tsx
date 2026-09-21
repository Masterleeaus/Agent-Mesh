import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface AppState {
  customerId: string | null;
  notificationUnreadCount: number;
  activeFilters: Record<string, string[]>;
}

interface AppContextValue {
  state: AppState;
  setCustomerId: (id: string) => void;
  setNotificationUnreadCount: (count: number) => void;
  setActiveFilters: (filters: Record<string, string[]>) => void;
  clearFilters: () => void;
}

const initialState: AppState = {
  customerId: null,
  notificationUnreadCount: 0,
  activeFilters: {},
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  const setCustomerId = useCallback((customerId: string) => {
    setState((prev) => ({ ...prev, customerId }));
  }, []);

  const setNotificationUnreadCount = useCallback((notificationUnreadCount: number) => {
    setState((prev) => ({ ...prev, notificationUnreadCount }));
  }, []);

  const setActiveFilters = useCallback((activeFilters: Record<string, string[]>) => {
    setState((prev) => ({ ...prev, activeFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setState((prev) => ({ ...prev, activeFilters: {} }));
  }, []);

  return (
    <AppContext.Provider value={{ state, setCustomerId, setNotificationUnreadCount, setActiveFilters, clearFilters }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

export { AppContext };
