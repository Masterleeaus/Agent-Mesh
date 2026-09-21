import { useState, useEffect } from 'react';
import type { AccountDetailVM, TimelineEventVM } from '../models';
import type { FollowupDTO } from '../models';

const MOCK_FOLLOWUPS: FollowupDTO[] = [
  { id: 'fu-1', accountId: 'acc-1', customerId: 'c-1', type: 'call', subject: 'Quarterly review', description: 'Schedule Q3 review call', priority: 'high', status: 'open', dueDate: '2025-07-10T10:00:00Z', ownerId: 'u-1', ownerName: 'Alice Johnson', notes: '', createdAt: '2025-06-20T08:00:00Z', updatedAt: '2025-06-20T08:00:00Z' },
  { id: 'fu-2', accountId: 'acc-1', customerId: 'c-1', type: 'email', subject: 'Contract renewal', description: 'Send renewal proposal', priority: 'urgent', status: 'overdue', dueDate: '2025-06-15T10:00:00Z', ownerId: 'u-2', ownerName: 'Bob Smith', notes: '', createdAt: '2025-06-01T08:00:00Z', updatedAt: '2025-06-01T08:00:00Z' },
];

const MOCK_TIMELINE: TimelineEventVM[] = [
  { id: 'evt-1', type: 'note', description: 'Account manager updated contact info', timestamp: '2025-06-28T14:30:00Z', actor: 'Alice Johnson' },
  { id: 'evt-2', type: 'followup', description: 'Follow-up created: Quarterly review', timestamp: '2025-06-20T08:00:00Z', actor: 'System' },
  { id: 'evt-3', type: 'scan', description: 'Health scan completed - score: 92', timestamp: '2025-06-15T12:00:00Z', actor: 'System' },
];

export function useAccountDetail(id: string | undefined) {
  const [data, setData] = useState<AccountDetailVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('No account ID provided');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      setData({
        id,
        name: 'Acme Corp',
        industry: 'Technology',
        healthStatus: 'healthy' as const,
        healthScore: 92,
        owner: 'Alice Johnson',
        email: 'acme@example.com',
        phone: '+1-555-0101',
        website: 'https://acme.example.com',
        address: '123 Main St',
        createdAt: '2025-01-15T08:00:00Z',
        lastScanDate: '2025-06-28T12:00:00Z',
        openTickets: 3,
        totalRevenue: 250000,
        riskLevel: 'info',
        tags: ['enterprise', 'premium'],
        contacts: [],
        recentActivity: MOCK_TIMELINE,
        healthHistory: [],
      });
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [id]);

  return { data, loading, error };
}
