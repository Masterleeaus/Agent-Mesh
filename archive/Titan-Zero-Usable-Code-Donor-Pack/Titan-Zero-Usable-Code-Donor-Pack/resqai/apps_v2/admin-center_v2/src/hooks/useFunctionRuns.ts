import { useState, useEffect, useCallback } from 'react';
import type { FunctionRunDTO } from '../models';
import { listFunctionRuns } from '../services/admin-service';

interface UseFunctionRunsResult { data: FunctionRunDTO[]; total: number; loading: boolean; error: string | null; refetch: () => void; }

export function useFunctionRuns(functionId?: string): UseFunctionRunsResult {
  const [data, setData] = useState<FunctionRunDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const refetch = useCallback(() => setRefresh(n => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    listFunctionRuns(functionId).then(res => { if (!cancelled) { setData(res.data); setTotal(res.total); setLoading(false); } }).catch(err => { if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [functionId, refresh]);

  return { data, total, loading, error, refetch };
}
