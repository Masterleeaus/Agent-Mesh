import { createContext, useContext } from 'react';
import type { Account, Followup, SlippingFollowupItem, AccountHealthScanResult } from '../types';

export type HealthFilter = 'all' | 'healthy' | 'watch' | 'slipping' | 'critical';

export interface CrmState {
  accounts: Account[];
  followups: Followup[];
  slippingAlerts: SlippingFollowupItem[];
  scanResult: AccountHealthScanResult | null;
  scanLoading: boolean;
  loading: boolean;
  error: string | null;
  healthFilter: HealthFilter;
  selectedAccountId: string | null;
}

export const defaultCrmState: CrmState = {
  accounts: [],
  followups: [],
  slippingAlerts: [],
  scanResult: null,
  scanLoading: false,
  loading: true,
  error: null,
  healthFilter: 'all',
  selectedAccountId: null,
};

export interface CrmContextValue {
  state: CrmState;
  setHealthFilter: (filter: HealthFilter) => void;
  selectAccount: (id: string | null) => void;
  refresh: () => Promise<void>;
  runHealthScan: () => Promise<void>;
}

export const CrmCtx = createContext<CrmContextValue | null>(null);

export function useCrmContext(): CrmContextValue {
  const ctx = useContext(CrmCtx);
  if (!ctx) throw new Error('useCrmContext must be used within CrmProvider');
  return ctx;
}
