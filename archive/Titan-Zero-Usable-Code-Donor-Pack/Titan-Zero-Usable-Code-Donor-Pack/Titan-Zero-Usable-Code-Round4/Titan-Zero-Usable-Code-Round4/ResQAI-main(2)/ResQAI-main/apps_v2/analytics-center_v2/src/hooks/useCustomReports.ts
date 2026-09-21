import { useState, useEffect, useCallback } from 'react';
import type { CustomReportDTO } from '../models/dto';
import { analyticsService } from '../services/analytics-service';

interface UseCustomReportsResult {
  data: CustomReportDTO[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCustomReports(): UseCustomReportsResult {
  const [data, setData] = useState<CustomReportDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsService.listReports();
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
