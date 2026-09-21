import { useState, useEffect } from 'react';
import type { SessionDTO } from '../models';
import { listSessions } from '../services/admin-service';

interface UseSessionsResult { data: SessionDTO[]; loading: boolean; error: string | null; }

export function useSessions(): UseSessionsResult {
  const [data, setData] = useState<SessionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listSessions().then(res => { if (!cancelled) { setData(res.data); setLoading(false); } }).catch(err => { if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load sessions'); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}
