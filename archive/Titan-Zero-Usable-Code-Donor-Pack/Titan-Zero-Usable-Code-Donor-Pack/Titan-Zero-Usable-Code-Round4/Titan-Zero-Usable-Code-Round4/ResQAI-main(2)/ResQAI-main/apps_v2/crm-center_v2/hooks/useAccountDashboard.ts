import { useState, useEffect, useCallback } from 'react';
import { getDashboard } from '../services/crm-service';
import type { AccountDashboardVM } from '../models/view-models';

export function useAccountDashboard() {
  const [data, setData] = useState<AccountDashboardVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboard();
      setData(res.data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
