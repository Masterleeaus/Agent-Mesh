import { useState, useEffect, useCallback } from 'react';
import type { KnowledgeBaseArticleVM } from '../models/view-models';
import type { KnowledgeBaseFilters } from '../models/api-requests';
import { resolutionService } from '../services/resolution-service';

interface UseKnowledgeBaseResult {
  articles: KnowledgeBaseArticleVM[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useKnowledgeBase(filters?: KnowledgeBaseFilters): UseKnowledgeBaseResult {
  const [articles, setArticles] = useState<KnowledgeBaseArticleVM[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await resolutionService.listKnowledgeBase(filters);
      setArticles(res.data.map(k => ({
        id: k.id,
        title: k.title,
        content: k.content,
        category: k.category,
        tags: k.tags,
        authorName: k.authorName,
        updatedAt: k.updatedAt,
      })));
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  return { articles, total, loading, error, refetch: fetch };
}
