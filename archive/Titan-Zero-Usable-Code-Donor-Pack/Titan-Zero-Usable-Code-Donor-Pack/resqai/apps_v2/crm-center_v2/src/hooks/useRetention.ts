import { useState, useEffect, useCallback } from 'react';
import type { RetentionDashboardVM } from '../models';

const MOCK_RETENTION: RetentionDashboardVM = {
  totalAtRisk: 24,
  recoveredThisMonth: 3,
  churnRate: 8.5,
  retentionRate: 91.5,
  avgCustomerLifetime: 42,
  atRiskByReason: [
    { reason: 'Payment overdue', count: 8 },
    { reason: 'Low engagement', count: 7 },
    { reason: 'Service complaints', count: 5 },
    { reason: 'Contract expiring', count: 4 },
  ],
  healthTrend: [
    { period: 'Jan', healthy: 85, atRisk: 12, churned: 3 },
    { period: 'Feb', healthy: 83, atRisk: 14, churned: 3 },
    { period: 'Mar', healthy: 80, atRisk: 16, churned: 4 },
    { period: 'Apr', healthy: 82, atRisk: 14, churned: 4 },
    { period: 'May', healthy: 79, atRisk: 17, churned: 4 },
    { period: 'Jun', healthy: 76, atRisk: 24, churned: 0 },
  ],
};

export function useRetention() {
  const [data, setData] = useState<RetentionDashboardVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setData(MOCK_RETENTION);
      setLoading(false);
    }, 600);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
