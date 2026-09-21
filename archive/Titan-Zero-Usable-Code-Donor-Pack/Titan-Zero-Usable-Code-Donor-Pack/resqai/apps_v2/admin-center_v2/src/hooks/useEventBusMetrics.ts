import { useState, useEffect } from 'react';
import type { EventBusHealthVM, EventBusMetricDTO } from '../models';
import { getEventBusMetrics } from '../services/admin-service';

interface UseEventBusMetricsResult { data: EventBusHealthVM | null; recentEvents: EventBusMetricDTO[]; loading: boolean; error: string | null; }

export function useEventBusMetrics(): UseEventBusMetricsResult {
  const [data, setData] = useState<EventBusHealthVM | null>(null);
  const [recentEvents, setRecentEvents] = useState<EventBusMetricDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getEventBusMetrics().then(res => { if (!cancelled) { setData(res.data); setRecentEvents(res.recentEvents); setLoading(false); } }).catch(err => { if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load metrics'); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  return { data, recentEvents, loading, error };
}
