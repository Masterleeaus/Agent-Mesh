import { useState } from 'react';
import { useAccounts } from '../../hooks/useAccounts';
import { Table, SearchBar, Filter, StatusBadge, Pagination, Skeleton, EmptyState, ErrorState, Button } from '../../../../shared/src/components';
import type { TableColumn } from '../../../../shared/src/components';
import { navigate } from '../../state/AppContext';
import type { AccountListItemVM } from '../../models/view-models';
import type { HealthStatus, RiskLevel } from '../../models/dto';

function healthVariant(s: HealthStatus): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (s) { case 'healthy': return 'success'; case 'warning': return 'warning'; case 'critical': return 'error'; default: return 'neutral'; }
}

function riskVariant(r: RiskLevel): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (r) { case 'critical': case 'high': return 'error'; case 'medium': return 'warning'; case 'low': return 'success'; default: return 'neutral'; }
}

export default function AccountListPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [healthFilter, setHealthFilter] = useState<string[]>([]);
  const { data, total, loading, error, refetch } = useAccounts({ search: search || undefined, healthStatus: healthFilter.length ? healthFilter : undefined, page, pageSize: 20 });

  const columns: TableColumn<AccountListItemVM>[] = [
    {
      key: 'name', header: 'Account Name', sortable: true,
      render: (_v: unknown, row: AccountListItemVM) => <span style={{ color: '#41d1c4', fontWeight: 500, cursor: 'pointer' }} onClick={() => navigate(`/accounts/${row.id}`)}>{row.name}</span>,
    },
    { key: 'industry', header: 'Industry' },
    {
      key: 'healthStatus', header: 'Health',
      render: (_v: unknown, row: AccountListItemVM) => <StatusBadge variant={healthVariant(row.healthStatus)} size="sm">{row.healthStatus}</StatusBadge>,
      sortable: true,
    },
    {
      key: 'healthScore', header: 'Score',
      render: (_v: unknown, row: AccountListItemVM) => <span style={{ color: row.healthScore >= 80 ? '#41d1c4' : row.healthScore >= 50 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>{row.healthScore}</span>,
      sortable: true,
    },
    { key: 'owner', header: 'Owner' },
    { key: 'openTickets', header: 'Tickets', sortable: true },
    { key: 'riskLevel', header: 'Risk', render: (_v: unknown, row: AccountListItemVM) => <StatusBadge variant={riskVariant(row.riskLevel)} size="sm" dot>{row.riskLevel}</StatusBadge> },
    { key: 'nextFollowupDate', header: 'Next Followup' },
    {
      key: 'lastScanDate', header: 'Last Scan',
      render: (_v: unknown, row: AccountListItemVM) => <span style={{ color: '#8b9bb5', fontSize: 12 }}>{row.lastScanDate || '—'}</span>,
    },
  ];

  const totalPages = Math.max(1, Math.ceil(total / 20));

  if (loading && data.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton variant="rectangular" height={40} width={400} />
        <div style={{ marginTop: 16 }}><Skeleton variant="rectangular" height={300} /></div>
      </div>
    );
  }

  if (error) {
    return <div style={{ padding: 24 }}><ErrorState error={error} onRetry={refetch} title="Failed to load accounts" /></div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Accounts</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="sm" onClick={refetch}>Refresh</Button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ flex: 1, maxWidth: 360 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search accounts..." />
        </div>
        <Filter
          groups={[{ id: 'health', label: 'Health Status', type: 'checkbox', options: [
            { label: 'Healthy', value: 'healthy' }, { label: 'Warning', value: 'warning' }, { label: 'Critical', value: 'critical' }, { label: 'Unknown', value: 'unknown' },
          ]}]}
          values={{ health: healthFilter }}
          onChange={(id: string, value: string, checked: boolean) => {
            setHealthFilter(prev => checked ? [...prev, value] : prev.filter(v => v !== value));
            setPage(1);
          }}
          onClear={() => { setHealthFilter([]); setPage(1); }}
        />
      </div>
      {data.length === 0 ? (
        <EmptyState title="No accounts found" description="Try adjusting your search or filter criteria." />
      ) : (
        <>
          <Table columns={columns} data={data} compact onRowClick={(row: AccountListItemVM) => navigate(`/accounts/${row.id}`)} />
          {totalPages > 1 && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
