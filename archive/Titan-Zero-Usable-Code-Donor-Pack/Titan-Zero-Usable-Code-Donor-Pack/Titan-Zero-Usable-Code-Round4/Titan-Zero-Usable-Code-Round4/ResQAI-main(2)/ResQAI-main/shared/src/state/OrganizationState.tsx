import { createContext, useContext, useMemo, useState, type ReactNode, type FC } from 'react';

export interface OrganizationState {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  settings: Record<string, unknown>;
}

export interface OrganizationStateContextValue {
  state: OrganizationState | null;
  setOrganization: (org: OrganizationState) => void;
  updateSettings: (settings: Record<string, unknown>) => void;
  clearOrganization: () => void;
}

export const OrganizationStateContext = createContext<OrganizationStateContextValue | null>(null);

export const OrganizationStateProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<OrganizationState | null>(null);
  const value = useMemo<OrganizationStateContextValue>(() => ({
    state,
    setOrganization: (org) => setState(org),
    updateSettings: (settings) => setState(prev => prev ? { ...prev, settings: { ...prev.settings, ...settings } } : prev),
    clearOrganization: () => setState(null),
  }), [state]);
  return (
    <OrganizationStateContext.Provider value={value}>
      {children}
    </OrganizationStateContext.Provider>
  );
};

export function useOrganizationState(): OrganizationStateContextValue {
  const ctx = useContext(OrganizationStateContext);
  if (!ctx) throw new Error('useOrganizationState must be used within OrganizationStateProvider');
  return ctx;
}
