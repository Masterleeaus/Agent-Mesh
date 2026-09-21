import { useState, useEffect, useCallback } from 'react';
import type { InteractionDTO } from '../models';

const MOCK_INTERACTIONS: InteractionDTO[] = [
  { id: 'int-1', accountId: 'acc-1', customerId: 'c-1', customerName: 'Alice Johnson', channel: 'phone', direction: 'inbound', subject: 'Service inquiry', summary: 'Customer called about annual maintenance package options.', duration: 480, agentId: 'u-1', agentName: 'Sarah Connor', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'int-2', accountId: 'acc-2', customerId: 'c-2', customerName: 'Bob Smith', channel: 'email', direction: 'outbound', subject: 'Contract renewal follow-up', summary: 'Sent renewal proposal with updated pricing for next fiscal year.', agentId: 'u-1', agentName: 'Sarah Connor', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'int-3', accountId: 'acc-1', customerId: 'c-1', customerName: 'Alice Johnson', channel: 'chat', direction: 'inbound', subject: 'Billing question', summary: 'Customer asked about recent invoice discrepancy. Resolved by clarifying credit.', duration: 320, agentId: 'u-2', agentName: 'Mike Peters', createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'int-4', accountId: 'acc-3', customerId: 'c-3', customerName: 'Carol Davis', channel: 'phone', direction: 'inbound', subject: 'Service complaint', summary: 'Customer reported dissatisfaction with recent service visit. Escalated to manager.', duration: 720, agentId: 'u-3', agentName: 'Lisa Wong', createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: 'int-5', accountId: 'acc-4', customerId: 'c-4', customerName: 'Dan Wilson', channel: 'email', direction: 'inbound', subject: 'Payment issue', summary: 'Customer reported payment processing error on last invoice.', agentId: 'u-1', agentName: 'Sarah Connor', createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: 'int-6', accountId: 'acc-5', customerId: 'c-5', customerName: 'Eve Martinez', channel: 'phone', direction: 'outbound', subject: 'Satisfaction check-in', summary: 'Called to check satisfaction after recent service. Customer happy with work.', duration: 240, agentId: 'u-2', agentName: 'Mike Peters', createdAt: new Date(Date.now() - 14 * 86400000).toISOString() },
];

export function useInteractions() {
  const [data, setData] = useState<InteractionDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setData(MOCK_INTERACTIONS);
      setTotal(MOCK_INTERACTIONS.length);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, total, loading, error, refetch: fetch };
}
