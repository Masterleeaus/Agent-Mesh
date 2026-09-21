import { createContext, useContext } from 'react';
import type { Ticket } from '../types';

export type FilterMode = 'open' | 'urgent' | 'new' | 'awaiting_approval' | 'all';

export interface SupportQueueState {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  filter: FilterMode;
  selectedId: string | null;
}

export const defaultState: SupportQueueState = {
  tickets: [],
  loading: true,
  error: null,
  filter: 'open',
  selectedId: null,
};

export interface SupportQueueContextValue {
  state: SupportQueueState;
  setFilter: (filter: FilterMode) => void;
  selectTicket: (id: string | null) => void;
  refresh: () => Promise<void>;
  updateLocalTicket: (id: string, patch: Partial<Ticket>) => void;
}

export const SupportQueueCtx = createContext<SupportQueueContextValue | null>(null);

export function useSupportQueue(): SupportQueueContextValue {
  const ctx = useContext(SupportQueueCtx);
  if (!ctx) throw new Error('useSupportQueue must be used within SupportQueueProvider');
  return ctx;
}
