import { useState, useEffect, useCallback } from 'react';
import type { ScheduledReportDTO } from '../models/dto';
import { analyticsService } from '../services/analytics-service';

interface UseScheduledReportsResult {
  data: ScheduledReportDTO[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useScheduledReports(): UseScheduledReportsResult {
  const [data, setData] = useState<ScheduledReportDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsService.listScheduledReports();
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scheduled reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
