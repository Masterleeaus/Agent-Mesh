import { useState, useEffect } from 'react';
import type { FollowupDTO } from '../models';

const MOCK_FOLLOWUPS: Record<string, FollowupDTO> = {
  'fu-1': {
    id: 'fu-1', accountId: 'acc-1', customerId: 'c-1', type: 'call', subject: 'Quarterly review',
    description: 'Schedule Q3 review call with the client to discuss progress and upcoming milestones.',
    priority: 'high', status: 'open', dueDate: '2025-07-10T10:00:00Z',
    ownerId: 'u-1', ownerName: 'Alice Johnson', notes: '', createdAt: '2025-06-20T08:00:00Z', updatedAt: '2025-06-20T08:00:00Z',
  },
};

export function useFollowupDetail(id: string | undefined) {
  const [data, setData] = useState<FollowupDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('No followup ID provided');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      const found = MOCK_FOLLOWUPS[id];
      if (found) {
        setData(found);
      } else {
        setData({
          id, accountId: 'acc-1', customerId: 'c-1', type: 'email', subject: 'Follow-up',
          description: 'Follow-up item details.', priority: 'medium', status: 'open',
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
          ownerId: 'u-1', ownerName: 'Alice Johnson', notes: '',
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        });
      }
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [id]);

  return { data, loading, error };
}
