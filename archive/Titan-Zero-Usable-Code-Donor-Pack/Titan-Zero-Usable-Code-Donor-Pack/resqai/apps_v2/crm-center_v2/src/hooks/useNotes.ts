import { useState, useEffect, useCallback } from 'react';
import type { NoteDTO } from '../models';

const MOCK_NOTES: NoteDTO[] = [
  { id: 'note-1', accountId: 'acc-1', customerId: 'c-1', category: 'account', title: 'Contract renewal notes', content: 'Customer expressed interest in upgrading to enterprise plan. Follow up next quarter with pricing.', authorId: 'u-1', authorName: 'Sarah Connor', pinned: true, createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'note-2', accountId: 'acc-1', customerId: 'c-1', category: 'meeting', title: 'Q2 review meeting', content: 'Discussed service performance and upcoming maintenance schedule. Customer satisfied with response times.', authorId: 'u-2', authorName: 'Mike Peters', pinned: false, createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'note-3', accountId: 'acc-2', customerId: 'c-2', category: 'support', title: 'Technical issue workaround', content: 'Provided temporary workaround for API integration issue. Permanent fix scheduled for next release.', authorId: 'u-1', authorName: 'Sarah Connor', pinned: false, createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'note-4', accountId: 'acc-3', customerId: 'c-3', category: 'billing', title: 'Credit request', content: 'Customer requested service credit for delayed appointment. Approved $150 credit.', authorId: 'u-3', authorName: 'Lisa Wong', pinned: false, createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 6 * 86400000).toISOString() },
];

export function useNotes() {
  const [data, setData] = useState<NoteDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setData(MOCK_NOTES);
      setLoading(false);
    }, 400);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
