import { createContext, useContext, useMemo, useState, type ReactNode, type FC } from 'react';

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: { id: string; email: string; name: string; roles: string[]; permissions: string[] } | null;
}

export interface AuthStateContextValue {
  state: AuthState;
  login: (token: string, user: AuthState['user']) => void;
  logout: () => void;
  updateUser: (user: Partial<AuthState['user']>) => void;
}

const INITIAL: AuthState = { isAuthenticated: false, token: null, user: null };
export const AuthStateContext = createContext<AuthStateContextValue | null>(null);

export const AuthStateProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(INITIAL);
  const value = useMemo<AuthStateContextValue>(() => ({
    state,
    login: (token, user) => setState({ isAuthenticated: true, token, user }),
    logout: () => setState(INITIAL),
    updateUser: (partial) => setState(prev => prev.user ? { ...prev, user: { ...prev.user, ...partial } } : prev),
  }), [state]);
  return (
    <AuthStateContext.Provider value={value}>
      {children}
    </AuthStateContext.Provider>
  );
};

export function useAuthState(): AuthStateContextValue {
  const ctx = useContext(AuthStateContext);
  if (!ctx) throw new Error('useAuthState must be used within AuthStateProvider');
  return ctx;
}
