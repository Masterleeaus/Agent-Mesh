import React, { useMemo, useCallback } from 'react';
import { useCrm } from '../hooks/useCrm';
import { CrmCtx } from '../state/atoms';
import { StatsRow } from '../components/StatsRow';
import { FilterBar } from '../components/FilterBar';
import { AccountList } from '../components/AccountList';
import { AccountDetail } from '../components/AccountDetail';
import { SlippingAlerts } from '../components/SlippingAlerts';
import { HealthScanPanel } from '../components/HealthScanPanel';
import type { HealthFilter } from '../state/atoms';

export function CrmTrackerPage() {
  const {
    state,
    filteredAccounts,
    selectedAccount,
    kpis,
    setHealthFilter,
    selectAccount,
    refresh,
    runHealthScan,
  } = useCrm();

  const filterCounts = useMemo<Record<HealthFilter, number>>(
    () => ({
      all: state.accounts.length,
      healthy: state.accounts.filter((a) => a.health === 'healthy').length,
      watch: state.accounts.filter((a) => a.health === 'watch').length,
      slipping: state.accounts.filter((a) => a.health === 'slipping').length,
      critical: state.accounts.filter((a) => a.health === 'critical').length,
    }),
    [state.accounts],
  );

  const ctxValue = useMemo(
    () => ({ state, setHealthFilter, selectAccount, refresh, runHealthScan }),
    [state, setHealthFilter, selectAccount, refresh, runHealthScan],
  );

  if (state.error) {
    return (
      <div style={{ padding: 24, color: 'var(--danger, #a23b3b)' }}>
        <h3>Error loading CRM data</h3>
        <p>{state.error}</p>
        <button className="btn btn-primary" onClick={refresh}>Retry</button>
      </div>
    );
  }

  return (
    <CrmCtx.Provider value={ctxValue}>
      <div style={styles.page}>
        <StatsRow {...kpis} />

        {state.loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted, #6b6353)' }}>
            Loading CRM data...
          </div>
        ) : (
          <div style={styles.grid}>
            <div style={styles.left}>
              <div style={styles.panelHeader}>
                <h2 style={styles.panelTitle}>Accounts</h2>
                <span style={styles.panelCount}>{filteredAccounts.length} accounts</span>
              </div>
              <FilterBar current={state.healthFilter} onFilter={setHealthFilter} counts={filterCounts} />
              <AccountList
                accounts={filteredAccounts}
                selectedId={state.selectedAccountId}
                onSelect={selectAccount}
              />
            </div>

            <div style={styles.right}>
              <div style={styles.panelHeader}>
                <h2 style={styles.panelTitle}>Slipping follow-ups</h2>
                {state.slippingAlerts.length > 0 && (
                  <span style={{ ...styles.panelCount, color: 'var(--danger, #a23b3b)' }}>
                    {state.slippingAlerts.length} alerts
                  </span>
                )}
              </div>
              <SlippingAlerts
                alerts={state.slippingAlerts}
                onSelectAccount={selectAccount}
              />

              {selectedAccount && (
                <>
                  <div style={{ ...styles.panelHeader, marginTop: 16 }}>
                    <h2 style={styles.panelTitle}>Account detail</h2>
                  </div>
                  <AccountDetail account={selectedAccount} followups={state.followups} />
                </>
              )}

              <div style={{ marginTop: 16 }}>
                <HealthScanPanel
                  scanResult={state.scanResult}
                  scanLoading={state.scanLoading}
                  onRunScan={runHealthScan}
                />
              </div>
            </div>
          </div>
        )}

        <div style={styles.footer}>
          Tables accounts, followups · Functions flag_slipping_followups, account_health_scan · Agent account_health_monitor
        </div>
      </div>
    </CrmCtx.Provider>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '0 24px 24px',
    maxWidth: 1440,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 420px',
    gap: 20,
    alignItems: 'start',
  },
  left: {},
  right: {},
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0 4px',
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: 700,
    margin: 0,
    fontFamily: 'Fraunces, serif',
    color: 'var(--ink, #1a1813)',
  },
  panelCount: {
    fontSize: 12,
    color: 'var(--muted, #6b6353)',
    fontFamily: 'JetBrains Mono, monospace',
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: 'var(--muted, #6b6353)',
    padding: '20px 0 8px',
    borderTop: '1px solid var(--line, #e7e0cf)',
    fontFamily: 'JetBrains Mono, monospace',
  },
};
