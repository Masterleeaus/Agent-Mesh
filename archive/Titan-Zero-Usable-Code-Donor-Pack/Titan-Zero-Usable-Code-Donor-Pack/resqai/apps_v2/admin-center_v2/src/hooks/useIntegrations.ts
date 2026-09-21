import { useState, useEffect, useCallback } from 'react';
import type { IntegrationDTO } from '../models';
import { listIntegrations } from '../services/admin-service';

interface UseIntegrationsResult { data: IntegrationDTO[]; total: number; loading: boolean; error: string | null; refetch: () => void; }

export function useIntegrations(): UseIntegrationsResult {
  const [data, setData] = useState<IntegrationDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const refetch = useCallback(() => setRefresh(n => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    listIntegrations().then(res => { if (!cancelled) { setData(res.data); setTotal(res.total); setLoading(false); } }).catch(err => { if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [refresh]);

  return { data, total, loading, error, refetch };
}
