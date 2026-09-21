import React, { useMemo } from 'react';
import { useTickets } from '../hooks/useTickets';
import { SupportQueueCtx } from '../state/atoms';
import { FilterBar } from '../components/FilterBar';
import { TicketList } from '../components/TicketList';
import { TicketDetail } from '../components/TicketDetail';
import type { FilterMode } from '../state/atoms';

export function SupportQueuePage() {
  const {
    state,
    filteredTickets,
    selectedTicket,
    setFilter,
    selectTicket,
    refresh,
    updateLocalTicket,
  } = useTickets();

  const counts = useMemo<Record<FilterMode, number>>(
    () => ({
      open: state.tickets.filter((t) => t.status !== 'closed' && t.status !== 'sent').length,
      urgent: state.tickets.filter((t) => t.urgency === 'urgent' && t.status !== 'closed' && t.status !== 'sent').length,
      new: state.tickets.filter((t) => t.status === 'new').length,
      awaiting_approval: state.tickets.filter((t) => t.approved_to_send === true && t.status !== 'sent' && t.status !== 'closed').length,
      all: state.tickets.length,
    }),
    [state.tickets],
  );

  const ctxValue = useMemo(
    () => ({ state, setFilter, selectTicket, refresh, updateLocalTicket }),
    [state, setFilter, selectTicket, refresh, updateLocalTicket],
  );

  if (state.error) {
    return (
      <div style={{ padding: 24, color: '#e74c3c' }}>
        <h3>Error loading tickets</h3>
        <p>{state.error}</p>
        <button className="btn btn-primary" onClick={refresh}>Retry</button>
      </div>
    );
  }

  return (
    <SupportQueueCtx.Provider value={ctxValue}>
      <div style={styles.page}>
        <h1 style={styles.heading}>Support Queue</h1>
        <FilterBar current={state.filter} onFilter={setFilter} counts={counts} />

        {state.loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted, #8b9bb5)' }}>
            Loading tickets...
          </div>
        ) : (
          <div style={styles.grid}>
            <div style={styles.left}>
              <TicketList
                tickets={filteredTickets}
                selectedId={state.selectedId}
                onSelect={selectTicket}
              />
            </div>
            <div style={styles.right}>
              {selectedTicket ? (
                <TicketDetail
                  ticket={selectedTicket}
                  onUpdate={updateLocalTicket}
                  onRefresh={refresh}
                />
              ) : (
                <div style={{ color: 'var(--muted, #8b9bb5)', textAlign: 'center', padding: 40 }}>
                  Select a ticket to view details
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SupportQueueCtx.Provider>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '0 24px 24px',
    maxWidth: 1440,
    margin: '0 auto',
  },
  heading: {
    fontSize: 22,
    fontWeight: 700,
    margin: '0 0 4px 0',
    color: 'var(--text, #e6ecf5)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 420px',
    gap: 20,
    alignItems: 'start',
  },
  left: {},
  right: {},
};
