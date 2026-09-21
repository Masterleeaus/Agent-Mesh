import { useState, useCallback } from 'react';
import type { SearchResultDTO } from '../models/dto';
import { analyticsService } from '../services/analytics-service';

interface UseSearchResult {
  results: SearchResultDTO[];
  loading: boolean;
  error: string | null;
  search: (query: string) => void;
  clear: () => void;
}

export function useSearch(): UseSearchResult {
  const [results, setResults] = useState<SearchResultDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true); setError(null);
    try { const res = await analyticsService.search(query); setResults(res.data); }
    catch (err) { setError(err instanceof Error ? err.message : 'Search failed'); }
    finally { setLoading(false); }
  }, []);

  const clear = useCallback(() => { setResults([]); setError(null); }, []);

  return { results, loading, error, search, clear };
}
