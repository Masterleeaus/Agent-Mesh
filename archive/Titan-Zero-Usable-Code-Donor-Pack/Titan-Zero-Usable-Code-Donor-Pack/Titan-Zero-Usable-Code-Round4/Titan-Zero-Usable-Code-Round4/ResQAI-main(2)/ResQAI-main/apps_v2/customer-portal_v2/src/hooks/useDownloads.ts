import { useState, useEffect, useCallback } from 'react';
import { CustomerService } from '../services/customer-service';
import type { DownloadListItemVM } from '../models/view-models';

interface UseDownloadsResult {
  data: DownloadListItemVM[];
  total: number;
  loading: boolean;
  error: string | null;
}

export function useDownloads(page: number = 1): UseDownloadsResult {
  const [data, setData] = useState<DownloadListItemVM[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback((p: number = page) => {
    setLoading(true);
    setError(null);
    CustomerService.listDownloads(p)
      .then((result) => { setData(result.downloads); setTotal(result.total); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load downloads'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, total, loading, error };
}