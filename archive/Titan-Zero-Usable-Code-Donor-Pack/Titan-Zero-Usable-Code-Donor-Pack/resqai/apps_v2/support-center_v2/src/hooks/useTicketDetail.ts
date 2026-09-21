import { useState, useEffect, useCallback } from 'react';
import type { TicketDetailVM } from '../models/view-models';
import { ticketService } from '../services/ticket-service';

interface UseTicketDetailResult {
  detail: TicketDetailVM | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTicketDetail(id: string): UseTicketDetailResult {
  const [detail, setDetail] = useState<TicketDetailVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ticketService.getById(id);
      setDetail({
        ticket: res.ticket,
        customer: res.customer,
        messages: res.messages.map(m => ({
          id: m.id, authorId: m.authorId, authorName: m.authorName,
          authorRole: m.authorRole, body: m.body, createdAt: m.createdAt,
        })),
        timeline: res.timeline.map(t => ({
          id: t.id, type: t.type, description: t.description,
          actorName: t.actorName, metadata: t.metadata, createdAt: t.createdAt,
        })),
        relatedAppointments: res.relatedAppointments,
        relatedDisputes: res.relatedDisputes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ticket detail');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { detail, loading, error, refetch: fetch };
}
