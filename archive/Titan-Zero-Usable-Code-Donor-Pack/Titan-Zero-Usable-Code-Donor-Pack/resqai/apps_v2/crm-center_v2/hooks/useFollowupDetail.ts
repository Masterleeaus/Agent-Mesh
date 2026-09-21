import { useState, useEffect, useCallback } from 'react';
import { getFollowup } from '../services/crm-service';
import type { FollowupDTO } from '../models/dto';

export function useFollowupDetail(id: string) {
  const [data, setData] = useState<FollowupDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFollowup(id);
      setData(res.data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load followup'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error };
}
