import { createContext, useContext, useMemo, useState, type ReactNode, type FC } from 'react';

export interface UserState {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  roles: string[];
  permissions: string[];
  preferences: Record<string, unknown>;
}

export interface UserStateContextValue {
  state: UserState | null;
  setUser: (user: UserState) => void;
  updatePreferences: (prefs: Record<string, unknown>) => void;
  clearUser: () => void;
}

export const UserStateContext = createContext<UserStateContextValue | null>(null);

export const UserStateProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<UserState | null>(null);
  const value = useMemo<UserStateContextValue>(() => ({
    state,
    setUser: (user) => setState(user),
    updatePreferences: (prefs) => setState(prev => prev ? { ...prev, preferences: { ...prev.preferences, ...prefs } } : prev),
    clearUser: () => setState(null),
  }), [state]);
  return (
    <UserStateContext.Provider value={value}>
      {children}
    </UserStateContext.Provider>
  );
};

export function useUserState(): UserStateContextValue {
  const ctx = useContext(UserStateContext);
  if (!ctx) throw new Error('useUserState must be used within UserStateProvider');
  return ctx;
}
