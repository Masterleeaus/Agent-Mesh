import { useState, useEffect, useCallback } from 'react';
import type { TicketListItem } from '../models/view-models';
import type { TicketListFilters } from '../models/api-requests';
import { ticketService } from '../services/ticket-service';

interface UseTicketsResult {
  tickets: TicketListItem[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTickets(filters?: TicketListFilters): UseTicketsResult {
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ticketService.list(filters);
      setTickets(res.data.map(t => ({
        id: t.id,
        subject: t.subject,
        customerName: t.customerName,
        requestType: t.requestType,
        channel: t.channel,
        urgency: t.urgency,
        status: t.status,
        ownerName: t.ownerName,
        age: 0,
        hasDraft: !!t.draftReply,
        isEscalated: t.status === 'escalated',
      })));
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  return { tickets, total, loading, error, refetch: fetch };
}
