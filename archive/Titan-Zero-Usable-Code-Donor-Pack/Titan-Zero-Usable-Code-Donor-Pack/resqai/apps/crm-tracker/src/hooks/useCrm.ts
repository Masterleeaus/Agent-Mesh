import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Account, Followup, SlippingFollowupItem, AccountHealthScanResult } from '../types';
import type { HealthFilter, CrmState } from '../state/atoms';
import { errorMessage } from '../../../../packages/utils/service-helpers';
import { refreshAll, runFullHealthScan } from '../services/crm-service';

interface KpiCounts {
  critical: number;
  slipping: number;
  watch: number;
  healthy: number;
  overdueFollowups: number;
  openFollowups: number;
}

const HEALTH_PRIORITY: Record<string, number> = {
  critical: 0,
  slipping: 1,
  watch: 2,
  healthy: 3,
};

function healthPriority(account: Account): number {
  return HEALTH_PRIORITY[account.health ?? 'healthy'] ?? 99;
}

function computeKpiCounts(accounts: Account[], followups: Followup[]): KpiCounts {
  return {
    critical: accounts.filter((a) => a.health === 'critical').length,
    slipping: accounts.filter((a) => a.health === 'slipping').length,
    watch: accounts.filter((a) => a.health === 'watch').length,
    healthy: accounts.filter((a) => a.health === 'healthy').length,
    overdueFollowups: followups.filter((f) => f.due_date && new Date(f.due_date) < new Date() && f.status !== 'completed' && f.status !== 'cancelled').length,
    openFollowups: followups.filter((f) => f.status !== 'completed' && f.status !== 'cancelled').length,
  };
}

export function useCrm() {
  const [state, setState] = useState<CrmState>({
    accounts: [],
    followups: [],
    slippingAlerts: [],
    scanResult: null,
    scanLoading: false,
    loading: true,
    error: null,
    healthFilter: 'all',
    selectedAccountId: null,
  });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { accounts, followups } = await refreshAll();
      setState((prev) => ({ ...prev, accounts, followups, loading: false }));
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, loading: false, error: errorMessage(err) }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setHealthFilter = useCallback((healthFilter: HealthFilter) => {
    setState((prev) => ({ ...prev, healthFilter }));
  }, []);

  const selectAccount = useCallback((selectedAccountId: string | null) => {
    setState((prev) => ({ ...prev, selectedAccountId }));
  }, []);

  const runHealthScan = useCallback(async () => {
    setState((prev) => ({ ...prev, scanLoading: true }));
    try {
      const { scanResult, slippingAlerts } = await runFullHealthScan();
      const { accounts, followups } = await refreshAll();
      setState((prev) => ({
        ...prev,
        scanResult,
        slippingAlerts,
        accounts,
        followups,
        scanLoading: false,
      }));
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, scanLoading: false, error: errorMessage(err) }));
    }
  }, []);

  const filteredAccounts = useMemo(() => {
    let list = [...state.accounts];
    if (state.healthFilter !== 'all') {
      list = list.filter((a) => a.health === state.healthFilter);
    }
    list.sort((a, b) => healthPriority(a) - healthPriority(b));
    return list;
  }, [state.accounts, state.healthFilter]);

  const selectedAccount = useMemo(
    () => state.accounts.find((a) => a.id === state.selectedAccountId) ?? null,
    [state.accounts, state.selectedAccountId],
  );

  const kpis = useMemo(() => computeKpiCounts(state.accounts, state.followups), [state.accounts, state.followups]);

  return {
    state,
    filteredAccounts,
    selectedAccount,
    kpis,
    setHealthFilter,
    selectAccount,
    refresh: load,
    runHealthScan,
  };
}
