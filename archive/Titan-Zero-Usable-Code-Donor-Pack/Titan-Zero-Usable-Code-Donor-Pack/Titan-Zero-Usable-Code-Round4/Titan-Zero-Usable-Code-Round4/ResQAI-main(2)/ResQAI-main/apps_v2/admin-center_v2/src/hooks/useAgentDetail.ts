import { useState, useEffect } from 'react';
import type { AgentDetailVM } from '../models';
import { getAgent } from '../services/admin-service';

interface UseAgentDetailResult { data: AgentDetailVM | null; loading: boolean; error: string | null; }

export function useAgentDetail(id: string): UseAgentDetailResult {
  const [data, setData] = useState<AgentDetailVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true); setError(null);
    getAgent(id).then(res => { if (!cancelled) { setData(res?.data || null); setLoading(false); } }).catch(err => { if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [id]);

  return { data, loading, error };
}
