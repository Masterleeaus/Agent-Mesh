import { useState, useEffect } from 'react';
import type { RoleDetailVM } from '../models';
import { getRole } from '../services/admin-service';

interface UseRoleDetailResult { data: RoleDetailVM | null; loading: boolean; error: string | null; }

export function useRoleDetail(id: string): UseRoleDetailResult {
  const [data, setData] = useState<RoleDetailVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getRole(id).then(res => { if (!cancelled) { setData(res?.data || null); setLoading(false); } }).catch(err => { if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load role'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [id]);

  return { data, loading, error };
}
