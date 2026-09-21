import { useState, useEffect, useCallback } from 'react';
import type { ExecutiveDashboardDTO } from '../models/dto';
import { analyticsService } from '../services/analytics-service';

interface UseExecutiveDashboardResult {
  data: ExecutiveDashboardDTO | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useExecutiveDashboard(): UseExecutiveDashboardResult {
  const [data, setData] = useState<ExecutiveDashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsService.getExecutiveDashboard();
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load executive dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
