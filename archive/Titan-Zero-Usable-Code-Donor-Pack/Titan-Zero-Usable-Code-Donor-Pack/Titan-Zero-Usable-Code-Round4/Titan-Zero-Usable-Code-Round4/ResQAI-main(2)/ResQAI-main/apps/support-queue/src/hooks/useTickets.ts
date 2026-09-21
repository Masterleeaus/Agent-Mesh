import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Ticket } from '../types';
import type { FilterMode, SupportQueueState } from '../state/atoms';
import { errorMessage } from '../../../../packages/utils/service-helpers';
import { fetchTickets } from '../services/ticket-service';

export function useTickets() {
  const [state, setState] = useState<SupportQueueState>({
    tickets: [],
    loading: true,
    error: null,
    filter: 'open',
    selectedId: null,
  });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const tickets = await fetchTickets();
      setState((prev) => ({ ...prev, tickets, loading: false }));
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, loading: false, error: errorMessage(err) }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setFilter = useCallback((filter: FilterMode) => {
    setState((prev) => ({ ...prev, filter }));
  }, []);

  const selectTicket = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedId: id }));
  }, []);

  const updateLocalTicket = useCallback((id: string, patch: Partial<Ticket>) => {
    setState((prev) => ({
      ...prev,
      tickets: prev.tickets.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const filteredTickets = useMemo(() => {
    const map: Record<FilterMode, (t: Ticket) => boolean> = {
      open: (t) => t.status !== 'closed' && t.status !== 'sent',
      urgent: (t) => t.urgency === 'urgent' && t.status !== 'closed' && t.status !== 'sent',
      new: (t) => t.status === 'new',
      awaiting_approval: (t) => t.approved_to_send === true && t.status !== 'sent' && t.status !== 'closed',
      all: () => true,
    };
    const fn = map[state.filter] ?? map.open;
    return state.tickets.filter(fn);
  }, [state.tickets, state.filter]);

  const selectedTicket = useMemo(
    () => state.tickets.find((t) => t.id === state.selectedId) ?? null,
    [state.tickets, state.selectedId],
  );

  return {
    state,
    filteredTickets,
    selectedTicket,
    setFilter,
    selectTicket,
    refresh: load,
    updateLocalTicket,
  };
}
