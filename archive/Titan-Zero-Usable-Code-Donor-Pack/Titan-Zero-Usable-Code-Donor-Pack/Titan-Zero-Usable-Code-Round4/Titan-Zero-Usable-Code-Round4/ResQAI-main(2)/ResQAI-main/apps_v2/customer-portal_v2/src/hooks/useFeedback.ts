import { useState, useEffect, useCallback } from 'react';
import { CustomerService } from '../services/customer-service';
import type { FeedbackListItemVM } from '../models/view-models';
import type { SubmitFeedbackRequest } from '../models/api-requests';
import type { FeedbackDTO } from '../models/dto';

interface UseFeedbackResult {
  data: FeedbackListItemVM[];
  total: number;
  loading: boolean;
  error: string | null;
  submitting: boolean;
  submitFeedback: (req: SubmitFeedbackRequest) => Promise<FeedbackDTO>;
}

export function useFeedback(page: number = 1): UseFeedbackResult {
  const [data, setData] = useState<FeedbackListItemVM[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback((p: number = page) => {
    setLoading(true);
    setError(null);
    CustomerService.listFeedback(p)
      .then((result) => { setData(result.feedback); setTotal(result.total); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load feedback'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const submitFeedback = useCallback(async (req: SubmitFeedbackRequest) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await CustomerService.submitFeedback(req);
      setData((prev) => [{ id: result.id, category: result.category, rating: result.rating, comment: result.comment, createdAt: result.createdAt }, ...prev]);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { data, total, loading, error, submitting, submitFeedback };
}