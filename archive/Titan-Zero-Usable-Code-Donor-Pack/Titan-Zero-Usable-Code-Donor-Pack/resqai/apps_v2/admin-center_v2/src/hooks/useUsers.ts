import { useState, useEffect, useCallback } from 'react';
import type { UserDTO } from '../models';
import { listUsers } from '../services/admin-service';

interface UseUsersResult { data: UserDTO[]; total: number; loading: boolean; error: string | null; refetch: () => void; }

export function useUsers(page = 1, pageSize = 20): UseUsersResult {
  const [data, setData] = useState<UserDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  const refetch = useCallback(() => setRefresh(n => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listUsers(page, pageSize).then(res => { if (!cancelled) { setData(res.data); setTotal(res.total); setLoading(false); } }).catch(err => { if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load users'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [page, pageSize, refresh]);

  return { data, total, loading, error, refetch };
}
