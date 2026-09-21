import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { DashboardContext } from '../state/atoms';
import { KpiCards } from '../components/KpiCards';
import { UrgentDispatch } from '../components/UrgentDispatch';
import { CoordinatorSection } from '../components/CoordinatorSection';
import { OperationsLog } from '../components/OperationsLog';

export function DashboardPage() {
  const { state, refresh, runCoordinatorAction } = useDashboard();

  const ctxValue = React.useMemo(
    () => ({ state, refresh, runCoordinatorAction }),
    [state, refresh, runCoordinatorAction],
  );

  if (state.loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
          color: 'var(--color-text-secondary, #888)',
        }}
      >
        Loading dashboard data...
      </div>
    );
  }

  if (state.error) {
    return (
      <div
        style={{
          padding: 24,
          color: '#f44336',
          background: 'rgba(244,67,54,0.08)',
          borderRadius: 'var(--radius-lg, 12px)',
        }}
      >
        <h3 style={{ margin: '0 0 8px', fontWeight: 600 }}>Error loading dashboard</h3>
        <p style={{ margin: 0, fontSize: 14 }}>{state.error}</p>
        <button
          onClick={refresh}
          style={{
            marginTop: 12,
            padding: '8px 20px',
            background: 'var(--color-primary, #6366f1)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <DashboardContext.Provider value={ctxValue}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 700,
                color: 'var(--color-text, #eee)',
              }}
            >
              Operations Dashboard
            </h1>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 14,
                color: 'var(--color-text-secondary, #888)',
              }}
            >
              Morning standup view · {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <button
            onClick={refresh}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              color: 'var(--color-text-secondary, #888)',
              border: '1px solid var(--color-border, #2a2a3e)',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            ⟳ Refresh
          </button>
        </div>

        {state.kpi && <KpiCards kpi={state.kpi} />}

        <UrgentDispatch tickets={state.urgentTickets} />

        <CoordinatorSection
          result={state.coordinatorResult}
          loading={state.coordinatorLoading}
          error={state.coordinatorError}
          onRun={runCoordinatorAction}
        />

        <OperationsLog entries={state.operationsLog} />
      </div>
    </DashboardContext.Provider>
  );
}
