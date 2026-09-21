import { useState } from 'react';
import { useOpportunities } from '../hooks/useOpportunities';
import { Table, Filter, StatusBadge, Pagination, Skeleton, EmptyState, ErrorState, Button, Card } from '../../../../shared/src/components';
import type { TableColumn } from '../../../../shared/src/components';
import type { OpportunityDTO } from '../models/dto';

const stageColors: Record<string, 'info' | 'warning' | 'success' | 'error' | 'neutral'> = {
  identified: 'info', qualified: 'info', proposal: 'warning', negotiation: 'warning', won: 'success', lost: 'error',
};

export default function UpsellOpportunitiesPage() {
  const [stageFilter, setStageFilter] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const { data, total, loading, error, refetch } = useOpportunities();

  const upsells = data.filter((o: OpportunityDTO) => o.type === 'upsell' || o.type === 'cross_sell');

  const columns: TableColumn<OpportunityDTO>[] = [
    { key: 'customerName', header: 'Customer', render: (_v: unknown, row: OpportunityDTO) => <span style={{ color: '#41d1c4', fontWeight: 500 }}>{row.customerName}</span> },
    { key: 'title', header: 'Opportunity' },
    { key: 'type', header: 'Type', render: (_v: unknown, row: OpportunityDTO) => <span style={{ color: row.type === 'upsell' ? '#f59e0b' : '#8b5cf6', fontWeight: 600, fontSize: 12 }}>{row.type.replace('_', ' ')}</span> },
    { key: 'stage', header: 'Stage', render: (_v: unknown, row: OpportunityDTO) => <StatusBadge variant={stageColors[row.stage] || 'neutral'} size="sm">{row.stage}</StatusBadge> },
    { key: 'value', header: 'Value', render: (_v: unknown, row: OpportunityDTO) => <span style={{ fontWeight: 600, color: '#e6ecf5' }}>${row.value.toLocaleString()}</span> },
    { key: 'probability', header: 'Prob.', render: (_v: unknown, row: OpportunityDTO) => <span style={{ color: row.probability >= 70 ? '#16a34a' : row.probability >= 40 ? '#f59e0b' : '#8b9bb5' }}>{row.probability}%</span> },
    { key: 'expectedCloseDate', header: 'Close Date', render: (_v: unknown, row: OpportunityDTO) => row.expectedCloseDate ? <span style={{ color: '#8b9bb5', fontSize: 12 }}>{new Date(row.expectedCloseDate).toLocaleDateString()}</span> : <span style={{ color: '#6b7280' }}>—</span> },
    { key: 'ownerName', header: 'Owner' },
  ];

  if (loading) {
    return <div style={{ padding: 24 }}><Skeleton variant="rectangular" height={40} width={400} /><div style={{ marginTop: 16 }}><Skeleton variant="rectangular" height={300} /></div></div>;
  }

  if (error) {
    return <div style={{ padding: 24 }}><ErrorState error={error} onRetry={refetch} title="Failed to load upsell opportunities" /></div>;
  }

  const totalValue = upsells.reduce((s: number, o: OpportunityDTO) => s + o.value, 0);
  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Upsell Opportunities</h1>
          <div style={{ fontSize: 13, color: '#8b9bb5', marginTop: 4 }}>{upsells.length} opportunities · ${totalValue.toLocaleString()} total value</div>
        </div>
        <Button variant="primary" size="sm" onClick={() => window.location.hash = '#/opportunities/new'}>New Opportunity</Button>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Filter groups={[{ id: 'stage', label: 'Stage', type: 'checkbox', options: [
          { label: 'Identified', value: 'identified' }, { label: 'Qualified', value: 'qualified' },
          { label: 'Proposal', value: 'proposal' }, { label: 'Negotiation', value: 'negotiation' },
          { label: 'Won', value: 'won' }, { label: 'Lost', value: 'lost' },
        ]}]} values={{ stage: stageFilter }}
          onChange={(id: string, value: string, checked: boolean) => { setStageFilter(prev => checked ? [...prev, value] : prev.filter(v => v !== value)); setPage(1); }}
          onClear={() => { setStageFilter([]); setPage(1); }} />
      </div>
      {upsells.length === 0 ? (
        <EmptyState title="No upsells" description="No upsell or cross-sell opportunities found." />
      ) : (
        <>
          <Table columns={columns} data={upsells} compact />
          {totalPages > 1 && <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}><Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} /></div>}
        </>
      )}
    </div>
  );
}
