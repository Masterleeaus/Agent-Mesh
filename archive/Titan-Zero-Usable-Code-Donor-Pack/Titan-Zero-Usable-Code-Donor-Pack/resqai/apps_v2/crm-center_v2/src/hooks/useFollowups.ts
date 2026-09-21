import { useState, useEffect, useCallback } from 'react';
import type { FollowupDTO } from '../models';

const MOCK_FOLLOWUPS: FollowupDTO[] = [
  { id: 'fu-1', accountId: 'acc-1', customerId: 'c-1', type: 'call', subject: 'Quarterly review', description: 'Schedule Q3 review call', priority: 'high', status: 'open', dueDate: '2025-07-10T10:00:00Z', ownerId: 'u-1', ownerName: 'Alice Johnson', notes: '', createdAt: '2025-06-20T08:00:00Z', updatedAt: '2025-06-20T08:00:00Z' },
  { id: 'fu-2', accountId: 'acc-1', customerId: 'c-1', type: 'email', subject: 'Contract renewal', description: 'Send renewal proposal', priority: 'urgent', status: 'overdue', dueDate: '2025-06-15T10:00:00Z', ownerId: 'u-2', ownerName: 'Bob Smith', notes: '', createdAt: '2025-06-01T08:00:00Z', updatedAt: '2025-06-01T08:00:00Z' },
  { id: 'fu-3', accountId: 'acc-2', customerId: 'c-2', type: 'meeting', subject: 'Product demo', description: 'Show new features', priority: 'medium', status: 'in_progress', dueDate: '2025-07-05T14:00:00Z', ownerId: 'u-1', ownerName: 'Alice Johnson', notes: '', createdAt: '2025-06-25T09:00:00Z', updatedAt: '2025-06-28T11:00:00Z' },
  { id: 'fu-4', accountId: 'acc-3', customerId: 'c-3', type: 'call', subject: 'Support escalation', description: 'High priority ticket review', priority: 'high', status: 'open', dueDate: '2025-07-02T10:00:00Z', ownerId: 'u-3', ownerName: 'Carol Davis', notes: '', createdAt: '2025-06-27T08:00:00Z', updatedAt: '2025-06-27T08:00:00Z' },
  { id: 'fu-5', accountId: 'acc-4', customerId: 'c-4', type: 'email', subject: 'Compliance check', description: 'Annual compliance documentation', priority: 'urgent', status: 'overdue', dueDate: '2025-06-01T10:00:00Z', ownerId: 'u-2', ownerName: 'Bob Smith', notes: '', createdAt: '2025-05-15T08:00:00Z', updatedAt: '2025-05-15T08:00:00Z' },
];

export function useFollowups() {
  const [data, setData] = useState<FollowupDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setData(MOCK_FOLLOWUPS);
      setTotal(MOCK_FOLLOWUPS.length);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, total, loading, error, refetch: fetch };
}
