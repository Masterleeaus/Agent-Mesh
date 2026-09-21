import { useState, useEffect, useCallback } from 'react';
import { listFollowups } from '../services/crm-service';
import type { FollowupListItemVM } from '../models/view-models';

interface FollowupFilter {
  accountId?: string;
  status?: string;
  priority?: string;
  overdue?: boolean;
  page?: number;
  pageSize?: number;
}

export function useFollowups(filter?: FollowupFilter) {
  const [data, setData] = useState<FollowupListItemVM[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listFollowups(filter);
      setData(res.data);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load followups'));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, total, loading, error, refetch: fetch };
}
