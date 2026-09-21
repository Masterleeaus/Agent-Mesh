import { useState, useEffect, useCallback } from 'react';
import type { CRMDashboardVM, InteractionVM, FollowupDTO, FeedbackVM, OpportunityVM } from '../models';

const MOCK_CRM_DASHBOARD: CRMDashboardVM = {
  totalCustomers: 124,
  activeAccounts: 98,
  atRiskAccounts: 24,
  overdueFollowups: 5,
  openTasks: 17,
  pendingRenewals: 8,
  satisfactionRate: 87,
  totalOpportunityValue: 485000,
  recentInteractions: [],
  pendingFollowups: [],
  recentFeedback: [],
  upcomingRenewals: [],
  healthDistribution: { healthy: 68, watch: 32, slipping: 16, critical: 8 },
};

export function useCRMDashboard() {
  const [data, setData] = useState<CRMDashboardVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setData(MOCK_CRM_DASHBOARD);
      setLoading(false);
    }, 600);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
