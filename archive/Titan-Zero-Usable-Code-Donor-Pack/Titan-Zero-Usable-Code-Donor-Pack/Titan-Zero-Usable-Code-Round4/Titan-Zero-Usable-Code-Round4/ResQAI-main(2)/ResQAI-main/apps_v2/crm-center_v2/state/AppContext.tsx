import { createContext, useContext, useState, useCallback, type ReactNode, type FC } from 'react';

interface AppState {
  currentUser: { id: string; name: string; role: string } | null;
  activeFilters: Record<string, string[]>;
  healthCategoryFilter: string | null;
  selectedAccountId: string | null;
  setCurrentUser: (user: { id: string; name: string; role: string } | null) => void;
  setActiveFilters: (filters: Record<string, string[]>) => void;
  setHealthCategoryFilter: (filter: string | null) => void;
  setSelectedAccountId: (id: string | null) => void;
}

const AppContext = createContext<AppState | null>(null);

export const AppProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppState['currentUser']>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [healthCategoryFilter, setHealthCategoryFilter] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser: useCallback((u) => setCurrentUser(u), []),
        activeFilters,
        setActiveFilters: useCallback((f) => setActiveFilters(f), []),
        healthCategoryFilter,
        setHealthCategoryFilter: useCallback((f) => setHealthCategoryFilter(f), []),
        selectedAccountId,
        setSelectedAccountId: useCallback((id) => setSelectedAccountId(id), []),
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useAppContext(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

export function navigate(path: string): void {
  window.location.hash = path;
}
