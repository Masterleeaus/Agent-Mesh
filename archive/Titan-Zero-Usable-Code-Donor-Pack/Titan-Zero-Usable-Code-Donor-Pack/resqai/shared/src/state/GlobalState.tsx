import { createContext, useContext, useMemo, useState, type ReactNode, type FC } from 'react';

export interface GlobalState {
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

export interface GlobalStateContextValue {
  state: GlobalState;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;
}

export const GlobalStateContext = createContext<GlobalStateContextValue | null>(null);

const INITIAL_STATE: GlobalState = { loading: false, error: null, initialized: false };

export const GlobalStateProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GlobalState>(INITIAL_STATE);
  const value = useMemo<GlobalStateContextValue>(() => ({
    state,
    setLoading: (loading) => setState(prev => ({ ...prev, loading })),
    setError: (error) => setState(prev => ({ ...prev, error })),
    setInitialized: (initialized) => setState(prev => ({ ...prev, initialized })),
    reset: () => setState(INITIAL_STATE),
  }), [state]);
  return (
    <GlobalStateContext.Provider value={value}>
      {children}
    </GlobalStateContext.Provider>
  );
};

export function useGlobalState(): GlobalStateContextValue {
  const ctx = useContext(GlobalStateContext);
  if (!ctx) throw new Error('useGlobalState must be used within GlobalStateProvider');
  return ctx;
}
