import { useState, useEffect, useCallback } from 'react';
import type { RoleDTO } from '../models';
import { listRoles } from '../services/admin-service';

interface UseRolesResult { data: RoleDTO[]; loading: boolean; error: string | null; refetch: () => void; }

export function useRoles(): UseRolesResult {
  const [data, setData] = useState<RoleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  const refetch = useCallback(() => setRefresh(n => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listRoles().then(res => { if (!cancelled) { setData(res.data); setLoading(false); } }).catch(err => { if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load roles'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [refresh]);

  return { data, loading, error, refetch };
}
