import { useState, useEffect } from 'react';
import type { UserDetailVM } from '../models';
import { getUser } from '../services/admin-service';

interface UseUserDetailResult { data: UserDetailVM | null; loading: boolean; error: string | null; }

export function useUserDetail(id: string): UseUserDetailResult {
  const [data, setData] = useState<UserDetailVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getUser(id).then(res => { if (!cancelled) { setData(res?.data || null); setLoading(false); } }).catch(err => { if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load user'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [id]);

  return { data, loading, error };
}
