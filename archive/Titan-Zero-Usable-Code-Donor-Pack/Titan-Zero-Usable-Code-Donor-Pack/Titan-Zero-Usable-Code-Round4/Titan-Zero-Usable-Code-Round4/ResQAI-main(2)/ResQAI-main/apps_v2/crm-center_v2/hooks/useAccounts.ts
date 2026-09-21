import { useState, useEffect, useCallback } from 'react';
import { listAccounts } from '../services/crm-service';
import type { AccountListItemVM } from '../models/view-models';
import type { AccountFilterRequest } from '../models/api-requests';

export function useAccounts(filter?: AccountFilterRequest) {
  const [data, setData] = useState<AccountListItemVM[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAccounts(filter);
      setData(res.data);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load accounts'));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, total, loading, error, refetch: fetch };
}
