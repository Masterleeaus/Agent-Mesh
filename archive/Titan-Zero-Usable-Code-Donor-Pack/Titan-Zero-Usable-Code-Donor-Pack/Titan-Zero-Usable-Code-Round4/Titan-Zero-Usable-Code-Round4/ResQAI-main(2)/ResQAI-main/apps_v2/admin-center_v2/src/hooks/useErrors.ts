import { useState, useEffect, useCallback } from 'react';
import type { ErrorEntryDTO } from '../models';
import { listErrors, resolveError } from '../services/admin-service';

interface UseErrorsResult { data: ErrorEntryDTO[]; total: number; loading: boolean; error: string | null; resolve: (id: string) => Promise<void>; refetch: () => void; }

export function useErrors(): UseErrorsResult {
  const [data, setData] = useState<ErrorEntryDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const refetch = useCallback(() => setRefresh(n => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    listErrors().then(res => { if (!cancelled) { setData(res.data); setTotal(res.total); setLoading(false); } }).catch(err => { if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [refresh]);

  const resolve = useCallback(async (id: string) => { await resolveError(id); refetch(); }, [refetch]);

  return { data, total, loading, error, resolve, refetch };
}
