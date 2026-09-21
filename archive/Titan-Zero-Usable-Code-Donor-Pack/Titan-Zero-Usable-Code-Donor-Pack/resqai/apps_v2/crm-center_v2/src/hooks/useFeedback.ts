import { useState, useEffect, useCallback } from 'react';
import type { FeedbackDTO, SatisfactionDTO } from '../models';

const MOCK_FEEDBACK: FeedbackDTO[] = [
  { id: 'fb-1', accountId: 'acc-1', customerId: 'c-1', customerName: 'Alice Johnson', category: 'service', sentiment: 'positive', rating: 5, subject: 'Great service', description: 'Technician was punctual and professional. Fixed issue quickly.', source: 'post_service_survey', acknowledged: true, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'fb-2', accountId: 'acc-2', customerId: 'c-2', customerName: 'Bob Smith', category: 'billing', sentiment: 'negative', rating: 2, subject: 'Billing confusion', description: 'Invoice was unclear and had unexpected charges.', source: 'email', acknowledged: false, createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: 'fb-3', accountId: 'acc-3', customerId: 'c-3', customerName: 'Carol Davis', category: 'support', sentiment: 'neutral', rating: 3, subject: 'Follow-up needed', description: 'Issue was partially resolved but needs another visit.', source: 'phone', acknowledged: false, createdAt: new Date(Date.now() - 6 * 86400000).toISOString() },
  { id: 'fb-4', accountId: 'acc-5', customerId: 'c-5', customerName: 'Eve Martinez', category: 'product', sentiment: 'positive', rating: 4, subject: 'Happy with new system', description: 'The new HVAC system works great. Energy bills are down.', source: 'post_service_survey', acknowledged: true, createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
];

const MOCK_SATISFACTION: SatisfactionDTO[] = [
  { id: 'sat-1', accountId: 'acc-1', customerId: 'c-1', customerName: 'Alice Johnson', overallScore: 5, serviceScore: 5, responseTimeScore: 4, resolutionScore: 5, surveySource: 'post_service', respondedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'sat-2', accountId: 'acc-2', customerId: 'c-2', customerName: 'Bob Smith', overallScore: 2, serviceScore: 3, responseTimeScore: 2, resolutionScore: 2, surveySource: 'post_service', respondedAt: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: 'sat-3', accountId: 'acc-5', customerId: 'c-5', customerName: 'Eve Martinez', overallScore: 4, serviceScore: 4, responseTimeScore: 4, resolutionScore: 5, surveySource: 'post_service', respondedAt: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: 'sat-4', accountId: 'acc-3', customerId: 'c-3', customerName: 'Carol Davis', overallScore: 3, serviceScore: 3, resolutionScore: 2, surveySource: 'post_service', respondedAt: new Date(Date.now() - 7 * 86400000).toISOString() },
];

export function useFeedback() {
  const [data, setData] = useState<FeedbackDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setData(MOCK_FEEDBACK);
      setTotal(MOCK_FEEDBACK.length);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, total, loading, error, refetch: fetch };
}

export function useSatisfaction() {
  const [data, setData] = useState<SatisfactionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setData(MOCK_SATISFACTION);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
