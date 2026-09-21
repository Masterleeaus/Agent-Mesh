import { useState, useEffect, useCallback } from 'react';
import type { SystemHealthDTO } from '../models/dto';
import { analyticsService } from '../services/analytics-service';

export function useSystemHealth() {
  const [data, setData] = useState<SystemHealthDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await analyticsService.getSystemHealth(); setData(res.data); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load system health'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}
