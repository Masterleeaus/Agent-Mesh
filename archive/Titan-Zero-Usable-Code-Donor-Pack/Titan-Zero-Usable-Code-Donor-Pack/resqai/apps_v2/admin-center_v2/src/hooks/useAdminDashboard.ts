import { useState, useEffect } from 'react';
import type { AdminDashboardVM } from '../models';
import { getDashboard } from '../services/admin-service';

interface UseAdminDashboardResult { data: AdminDashboardVM | null; loading: boolean; error: string | null; }

export function useAdminDashboard(): UseAdminDashboardResult {
  const [data, setData] = useState<AdminDashboardVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getDashboard().then(res => { if (!cancelled) { setData(res.data); setLoading(false); } }).catch(err => { if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load dashboard'); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}
