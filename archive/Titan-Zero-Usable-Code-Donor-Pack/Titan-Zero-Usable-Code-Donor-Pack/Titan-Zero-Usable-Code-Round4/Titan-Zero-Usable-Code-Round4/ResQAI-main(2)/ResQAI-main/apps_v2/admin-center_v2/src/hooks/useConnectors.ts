import { useState, useEffect, useCallback } from 'react';
import type { ConnectorDTO } from '../models';
import { listConnectors } from '../services/admin-service';

interface UseConnectorsResult { data: ConnectorDTO[]; loading: boolean; error: string | null; refetch: () => void; }

export function useConnectors(): UseConnectorsResult {
  const [data, setData] = useState<ConnectorDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  const refetch = useCallback(() => setRefresh(n => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listConnectors().then(res => { if (!cancelled) { setData(res.data); setLoading(false); } }).catch(err => { if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load connectors'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [refresh]);

  return { data, loading, error, refetch };
}
