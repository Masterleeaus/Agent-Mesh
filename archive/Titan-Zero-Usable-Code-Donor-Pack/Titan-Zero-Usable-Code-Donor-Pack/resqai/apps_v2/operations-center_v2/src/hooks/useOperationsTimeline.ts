import { useState, useEffect, useCallback } from 'react';
import type { TimelineEventDTO } from '../models/dto';
import { operationsService } from '../services/operations-service';

interface UseOperationsTimelineResult {
  events: TimelineEventDTO[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useOperationsTimeline(): UseOperationsTimelineResult {
  const [events, setEvents] = useState<TimelineEventDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await operationsService.getTimeline();
      setEvents(res.data);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { events, total, loading, error, refetch: fetch };
}
