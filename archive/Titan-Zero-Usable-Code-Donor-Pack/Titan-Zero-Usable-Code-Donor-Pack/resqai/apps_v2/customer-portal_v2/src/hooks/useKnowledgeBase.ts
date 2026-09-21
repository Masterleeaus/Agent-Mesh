import { useState, useEffect, useCallback } from 'react';
import { CustomerService } from '../services/customer-service';
import type { KnowledgeBaseListItemVM, KnowledgeBaseArticleDTO } from '../models/dto';

interface UseKnowledgeBaseSearchResult {
  data: KnowledgeBaseListItemVM[];
  total: number;
  loading: boolean;
  error: string | null;
  search: (query: string) => void;
}

interface UseKnowledgeBaseArticleResult {
  data: KnowledgeBaseArticleDTO | null;
  loading: boolean;
  error: string | null;
}

export function useKnowledgeBaseSearch(query: string = ''): UseKnowledgeBaseSearchResult {
  const [data, setData] = useState<KnowledgeBaseListItemVM[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback((q: string) => {
    setLoading(true);
    setError(null);
    CustomerService.searchKnowledgeBase(q)
      .then((result) => { setData(result.articles); setTotal(result.total); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Search failed'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { search(query); }, [search, query]);

  return { data, total, loading, error, search };
}

export function useKnowledgeBaseArticle(id: string): UseKnowledgeBaseArticleResult {
  const [data, setData] = useState<KnowledgeBaseArticleDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setData(null); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    CustomerService.getKnowledgeBaseArticle(id)
      .then((result) => { if (!cancelled) setData(result); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load article'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  return { data, loading, error };
}