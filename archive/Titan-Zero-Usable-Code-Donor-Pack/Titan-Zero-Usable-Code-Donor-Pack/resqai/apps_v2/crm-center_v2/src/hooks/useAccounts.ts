import { useState, useEffect, useCallback } from 'react';
import type { AccountDTO } from '../models';

const MOCK_ACCOUNTS: AccountDTO[] = [
  { id: 'acc-1', customerId: 'c-1', customerName: 'Acme Corp', email: 'acme@example.com', phone: '+1-555-0101', health: 'healthy', healthScore: 92, createdAt: '2025-01-15T08:00:00Z', updatedAt: '2025-06-28T12:00:00Z' },
  { id: 'acc-2', customerId: 'c-2', customerName: 'Globex Inc', email: 'globex@example.com', phone: '+1-555-0102', health: 'watch', healthScore: 65, createdAt: '2025-02-10T09:00:00Z', updatedAt: '2025-06-27T10:00:00Z' },
  { id: 'acc-3', customerId: 'c-3', customerName: 'Initech', email: 'initech@example.com', phone: '+1-555-0103', health: 'slipping', healthScore: 38, createdAt: '2025-03-05T10:00:00Z', updatedAt: '2025-06-26T15:00:00Z' },
  { id: 'acc-4', customerId: 'c-4', customerName: 'Umbrella Co', email: 'umbrella@example.com', phone: '+1-555-0104', health: 'critical', healthScore: 18, createdAt: '2025-01-20T11:00:00Z', updatedAt: '2025-06-25T09:00:00Z' },
  { id: 'acc-5', customerId: 'c-5', customerName: 'Hooli LLC', email: 'hooli@example.com', phone: '+1-555-0105', health: 'healthy', healthScore: 88, createdAt: '2025-04-01T12:00:00Z', updatedAt: '2025-06-28T08:00:00Z' },
  { id: 'acc-6', customerId: 'c-6', customerName: 'Stark Industries', email: 'stark@example.com', phone: '+1-555-0106', health: 'watch', healthScore: 55, createdAt: '2025-02-20T13:00:00Z', updatedAt: '2025-06-24T14:00:00Z' },
  { id: 'acc-7', customerId: 'c-7', customerName: 'Wayne Enterprises', email: 'wayne@example.com', phone: '+1-555-0107', health: 'slipping', healthScore: 32, createdAt: '2025-03-15T14:00:00Z', updatedAt: '2025-06-23T11:00:00Z' },
];

export function useAccounts() {
  const [data, setData] = useState<AccountDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setData(MOCK_ACCOUNTS);
      setTotal(MOCK_ACCOUNTS.length);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, total, loading, error, refetch: fetch };
}
