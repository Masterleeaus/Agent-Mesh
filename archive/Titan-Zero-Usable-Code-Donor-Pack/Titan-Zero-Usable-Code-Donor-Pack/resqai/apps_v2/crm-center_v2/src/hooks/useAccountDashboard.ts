import { useState, useEffect, useCallback } from 'react';
import type { AccountDashboardVM } from '../models';

const MOCK_DASHBOARD: AccountDashboardVM = {
  totalAccounts: 124,
  healthDistribution: { healthy: 68, watch: 32, slipping: 16, critical: 8 },
  averageHealthScore: 74,
  criticalAccounts: 8,
  slippingAccounts: 16,
  healthyAccounts: 68,
  watchAccounts: 32,
  recentRiskSignals: [],
  overdueFollowups: 5,
  lastScanDate: new Date().toISOString(),
  upcomingAppointments: 12,
  openTasks: 24,
  pendingRenewals: 7,
  satisfactionRate: 88,
};

export function useAccountDashboard() {
  const [data, setData] = useState<AccountDashboardVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setData(MOCK_DASHBOARD);
      setLoading(false);
    }, 600);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
