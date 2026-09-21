import { useState, useEffect } from 'react';
import type { ApplicationDetailVM } from '../models';
import { getApplication } from '../services/admin-service';

interface UseApplicationDetailResult { data: ApplicationDetailVM | null; loading: boolean; error: string | null; }

export function useApplicationDetail(id: string): UseApplicationDetailResult {
  const [data, setData] = useState<ApplicationDetailVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true); setError(null);
    getApplication(id).then(res => { if (!cancelled) { setData(res?.data || null); setLoading(false); } }).catch(err => { if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [id]);

  return { data, loading, error };
}
