import { useState, useEffect, useCallback } from 'react';
import { listHealthScans, runHealthScan } from '../services/crm-service';
import type { HealthScanResultVM } from '../models/view-models';

export function useHealthScans(accountId?: string) {
  const [data, setData] = useState<HealthScanResultVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listHealthScans(accountId);
      setData(res.data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load health scans'));
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => { fetch(); }, [fetch]);

  const scan = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await runHealthScan(id);
      await fetch();
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to run health scan'));
      setLoading(false);
    }
  }, [fetch]);

  return { data, loading, error, refetch: fetch, runScan: scan };
}
