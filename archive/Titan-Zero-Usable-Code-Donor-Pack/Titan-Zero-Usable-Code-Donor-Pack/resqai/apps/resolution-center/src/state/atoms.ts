import { createContext, useContext } from 'react';
import type { Dispute, Appointment, Customer } from '../types';

export interface ResolutionCenterState {
  disputes: Dispute[];
  appointments: Appointment[];
  customers: Customer[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
}

export const defaultState: ResolutionCenterState = {
  disputes: [],
  appointments: [],
  customers: [],
  loading: true,
  error: null,
  selectedId: null,
};

export interface ResolutionCenterContextValue {
  state: ResolutionCenterState;
  selectDispute: (id: string | null) => void;
  refresh: () => Promise<void>;
  updateLocalDispute: (id: string, patch: Partial<Dispute>) => void;
}

export const ResolutionCenterCtx = createContext<ResolutionCenterContextValue | null>(null);

export function useResolutionCenter(): ResolutionCenterContextValue {
  const ctx = useContext(ResolutionCenterCtx);
  if (!ctx) throw new Error('useResolutionCenter must be used within ResolutionCenterProvider');
  return ctx;
}
