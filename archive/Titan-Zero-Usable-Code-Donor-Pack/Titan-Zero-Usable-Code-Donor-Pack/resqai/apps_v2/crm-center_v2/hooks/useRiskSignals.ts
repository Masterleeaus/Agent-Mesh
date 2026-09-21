import { useState, useEffect, useCallback } from 'react';
import { listRiskSignals } from '../services/crm-service';
import type { RiskSignalVM } from '../models/view-models';

interface RiskSignalFilter {
  accountId?: string;
  level?: string;
  acknowledged?: boolean;
}

export function useRiskSignals(params?: RiskSignalFilter) {
  const [data, setData] = useState<RiskSignalVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listRiskSignals(params);
      setData(res.data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load risk signals'));
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
