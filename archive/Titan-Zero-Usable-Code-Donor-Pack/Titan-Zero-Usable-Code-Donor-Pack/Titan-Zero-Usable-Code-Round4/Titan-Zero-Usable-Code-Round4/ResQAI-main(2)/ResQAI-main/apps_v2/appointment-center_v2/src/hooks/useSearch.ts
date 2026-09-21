import { useState, useEffect, useCallback } from 'react';
import { appointmentService } from '../services';
import type { SearchResultVM } from '../models/view-models';

export function useSearch(query: string, debounceMs = 300) {
  const [results, setResults] = useState<SearchResultVM[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await appointmentService.search(q);
      setResults(res.results);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetch(query), debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs, fetch]);

  return { results, total, loading, error };
}
