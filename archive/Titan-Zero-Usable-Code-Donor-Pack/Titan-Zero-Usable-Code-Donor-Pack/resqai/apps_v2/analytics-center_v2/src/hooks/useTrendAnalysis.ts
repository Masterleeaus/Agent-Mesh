import { useState, useEffect, useCallback } from 'react';
import type { TrendAnalysisDTO } from '../models/dto';
import { analyticsService } from '../services/analytics-service';

export function useTrendAnalysis() {
  const [data, setData] = useState<TrendAnalysisDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await analyticsService.getTrendAnalysis(); setData(res.data); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load trend analysis'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}
