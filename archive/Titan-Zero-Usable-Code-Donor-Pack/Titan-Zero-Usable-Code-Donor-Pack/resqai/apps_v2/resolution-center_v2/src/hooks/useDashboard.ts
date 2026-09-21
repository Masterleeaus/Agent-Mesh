import { useState, useEffect, useCallback } from 'react';
import type { ResolutionDashboardVM } from '../models/view-models';
import { resolutionService } from '../services/resolution-service';

interface UseDashboardResult {
  dashboard: ResolutionDashboardVM | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboard(): UseDashboardResult {
  const [dashboard, setDashboard] = useState<ResolutionDashboardVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await resolutionService.getDashboard();
      setDashboard(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { dashboard, loading, error, refetch: fetch };
}
