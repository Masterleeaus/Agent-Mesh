import { useState, useEffect, useCallback } from 'react';
import { getAccount } from '../services/crm-service';
import type { AccountDetailVM } from '../models/view-models';

export function useAccountDetail(id: string) {
  const [data, setData] = useState<AccountDetailVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAccount(id);
      setData(res.data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load account detail'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error };
}
