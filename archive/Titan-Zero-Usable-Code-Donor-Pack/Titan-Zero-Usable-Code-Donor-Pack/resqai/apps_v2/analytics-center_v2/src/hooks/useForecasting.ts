import { useState, useEffect, useCallback } from 'react';
import type { ForecastDTO } from '../models/dto';
import { analyticsService } from '../services/analytics-service';

export function useForecasting(metric: string = 'tickets', periods: number = 3) {
  const [data, setData] = useState<ForecastDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await analyticsService.getForecast(metric, periods); setData(res.data); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load forecast'); }
    finally { setLoading(false); }
  }, [metric, periods]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
