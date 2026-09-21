import { useState, useEffect, useCallback } from 'react';
import type { ExportHistoryDTO } from '../models/dto';
import { analyticsService } from '../services/analytics-service';

export function useExportHistory() {
  const [data, setData] = useState<ExportHistoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await analyticsService.getExportHistory(); setData(res.data); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load export history'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}
