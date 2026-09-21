import React, { useMemo } from 'react';
import { useDisputes } from '../hooks/useDisputes';
import { ResolutionCenterCtx } from '../state/atoms';
import { KpiCards } from '../components/KpiCards';
import { DisputeList } from '../components/DisputeList';
import { DisputeDetail } from '../components/DisputeDetail';

export function ResolutionCenterPage() {
  const {
    state,
    sortedDisputes,
    selectedDispute,
    selectedAppointment,
    selectedCustomer,
    kpis,
    selectDispute,
    refresh,
    updateLocalDispute,
  } = useDisputes();

  const ctxValue = useMemo(
    () => ({ state, selectDispute, refresh, updateLocalDispute }),
    [state, selectDispute, refresh, updateLocalDispute],
  );

  if (state.error) {
    return (
      <div style={{ padding: 24, color: '#e74c3c' }}>
        <h3>Error loading disputes</h3>
        <p>{state.error}</p>
        <button className="btn btn-primary" onClick={refresh}>Retry</button>
      </div>
    );
  }

  return (
    <ResolutionCenterCtx.Provider value={ctxValue}>
      <div style={styles.page}>
        <h1 style={styles.heading}>Resolution Center</h1>
        <KpiCards
          awaitingApproval={kpis.awaitingApproval}
          totalOpen={kpis.totalOpen}
          resolved={kpis.resolved}
        />

        {state.loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted, #8b9bb5)' }}>
            Loading disputes...
          </div>
        ) : (
          <div style={styles.grid}>
            <div style={styles.left}>
              <DisputeList
                disputes={sortedDisputes}
                appointments={state.appointments}
                customers={state.customers}
                selectedId={state.selectedId}
                onSelect={selectDispute}
              />
            </div>
            <div style={styles.right}>
              {selectedDispute ? (
                <DisputeDetail
                  dispute={selectedDispute}
                  appointment={selectedAppointment}
                  customer={selectedCustomer}
                  onUpdate={updateLocalDispute}
                  onRefresh={refresh}
                />
              ) : (
                <div style={{ color: 'var(--muted, #8b9bb5)', textAlign: 'center', padding: 40 }}>
                  Select a dispute to view details
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ResolutionCenterCtx.Provider>
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
    margin: '0 0 16px 0',
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
