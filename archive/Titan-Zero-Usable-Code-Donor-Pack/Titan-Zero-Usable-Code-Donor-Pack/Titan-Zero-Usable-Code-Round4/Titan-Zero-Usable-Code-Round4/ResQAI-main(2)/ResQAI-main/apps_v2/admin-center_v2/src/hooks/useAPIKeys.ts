import { useState, useEffect, useCallback } from 'react';
import type { APIKeyDTO } from '../models';
import { listAPIKeys, revokeAPIKey } from '../services/admin-service';

interface UseAPIKeysResult { data: APIKeyDTO[]; total: number; loading: boolean; error: string | null; revoke: (id: string) => Promise<void>; refetch: () => void; }

export function useAPIKeys(): UseAPIKeysResult {
  const [data, setData] = useState<APIKeyDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const refetch = useCallback(() => setRefresh(n => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    listAPIKeys().then(res => { if (!cancelled) { setData(res.data); setTotal(res.total); setLoading(false); } }).catch(err => { if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [refresh]);

  const revoke = useCallback(async (id: string) => { await revokeAPIKey(id); refetch(); }, [refetch]);

  return { data, total, loading, error, revoke, refetch };
}
