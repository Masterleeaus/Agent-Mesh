import { useState, useEffect, useCallback } from 'react';
import type { CustomerDTO } from '../models';

const MOCK_CUSTOMERS: CustomerDTO[] = [
  { id: 'c-1', name: 'Alice Johnson', email: 'alice@example.com', phone: '+1-555-0101', status: 'active', accountId: 'acc-1', accountName: 'Acme Corp', tags: ['vip', 'annual'], lifetimeValue: 45000, lastContactDate: '2025-06-20T10:00:00Z', createdAt: '2024-01-15T08:00:00Z' },
  { id: 'c-2', name: 'Bob Smith', email: 'bob@example.com', phone: '+1-555-0102', status: 'active', accountId: 'acc-2', accountName: 'Globex Inc', tags: ['enterprise'], lifetimeValue: 120000, lastContactDate: '2025-06-18T14:00:00Z', createdAt: '2024-02-10T09:00:00Z' },
  { id: 'c-3', name: 'Carol Davis', email: 'carol@example.com', phone: '+1-555-0103', status: 'at_risk', accountId: 'acc-3', accountName: 'Initech', tags: ['slipping'], lifetimeValue: 28000, lastContactDate: '2025-05-01T11:00:00Z', createdAt: '2024-03-05T10:00:00Z' },
  { id: 'c-4', name: 'Dan Wilson', email: 'dan@example.com', phone: '+1-555-0104', status: 'critical', accountId: 'acc-4', accountName: 'Umbrella Co', tags: ['overdue'], lifetimeValue: 15000, lastContactDate: '2025-04-15T09:00:00Z', createdAt: '2024-01-20T11:00:00Z' },
  { id: 'c-5', name: 'Eve Martinez', email: 'eve@example.com', phone: '+1-555-0105', status: 'active', accountId: 'acc-5', accountName: 'Hooli LLC', lifetimeValue: 75000, lastContactDate: '2025-06-25T16:00:00Z', createdAt: '2024-04-01T12:00:00Z' },
  { id: 'c-6', name: 'Frank Lee', email: 'frank@example.com', phone: '+1-555-0106', status: 'active', accountId: 'acc-6', accountName: 'Stark Industries', tags: ['vip'], lifetimeValue: 210000, lastContactDate: '2025-06-22T08:00:00Z', createdAt: '2024-02-20T13:00:00Z' },
  { id: 'c-7', name: 'Grace Kim', email: 'grace@example.com', phone: '+1-555-0107', status: 'at_risk', accountId: 'acc-7', accountName: 'Wayne Enterprises', tags: ['churn_risk'], lifetimeValue: 95000, lastContactDate: '2025-05-30T10:00:00Z', createdAt: '2024-03-15T14:00:00Z' },
  { id: 'c-8', name: 'Henry Brown', email: 'henry@example.com', phone: '+1-555-0108', status: 'active', accountId: 'acc-5', accountName: 'Hooli LLC', lifetimeValue: 32000, lastContactDate: '2025-06-10T12:00:00Z', createdAt: '2024-05-10T08:00:00Z' },
];

export function useCustomers() {
  const [data, setData] = useState<CustomerDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setData(MOCK_CUSTOMERS);
      setTotal(MOCK_CUSTOMERS.length);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, total, loading, error, refetch: fetch };
}

export function useCustomerDetail(id: string | undefined) {
  const [data, setData] = useState<CustomerDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('No customer ID provided');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      const found = MOCK_CUSTOMERS.find(c => c.id === id);
      setData(found || MOCK_CUSTOMERS[0]);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [id]);

  return { data, loading, error };
}
