import { useState } from 'react';
import { useInteractions } from '../hooks/useInteractions';
import { Table, Filter, SearchBar, StatusBadge, Pagination, Skeleton, EmptyState, ErrorState, Card } from '../../../../shared/src/components';
import type { TableColumn } from '../../../../shared/src/components';
import type { InteractionDTO } from '../models/dto';

const channelVariant: Record<string, 'info' | 'success' | 'warning' | 'neutral'> = {
  phone: 'info', email: 'success', chat: 'warning', portal: 'neutral', in_person: 'info', social: 'warning',
};

const directionColor: Record<string, string> = { inbound: '#3b82f6', outbound: '#f59e0b' };

export default function InteractionHistoryPage() {
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const { data, total, loading, error, refetch } = useInteractions();

  const columns: TableColumn<InteractionDTO>[] = [
    { key: 'customerName', header: 'Customer', sortable: true,
      render: (_v: unknown, row: InteractionDTO) => <span style={{ color: '#41d1c4', fontWeight: 500 }}>{row.customerName}</span> },
    { key: 'channel', header: 'Channel',
      render: (_v: unknown, row: InteractionDTO) => <StatusBadge variant={channelVariant[row.channel] || 'neutral'} size="sm">{row.channel}</StatusBadge> },
    { key: 'direction', header: 'Direction',
      render: (_v: unknown, row: InteractionDTO) => <span style={{ color: directionColor[row.direction] || '#8b9bb5', fontWeight: 600, textTransform: 'uppercase', fontSize: 11 }}>{row.direction}</span> },
    { key: 'subject', header: 'Subject' },
    { key: 'summary', header: 'Summary', render: (_v: unknown, row: InteractionDTO) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{row.summary}</span> },
    { key: 'agentName', header: 'Agent' },
    { key: 'duration', header: 'Duration',
      render: (_v: unknown, row: InteractionDTO) => row.duration ? <span>{Math.floor(row.duration / 60)}m</span> : <span style={{ color: '#6b7280' }}>—</span> },
    { key: 'createdAt', header: 'Date', render: (_v: unknown, row: InteractionDTO) => <span style={{ color: '#8b9bb5', fontSize: 12 }}>{new Date(row.createdAt).toLocaleDateString()}</span> },
  ];

  const totalPages = Math.max(1, Math.ceil(total / 20));

  if (loading) {
    return <div style={{ padding: 24 }}><Skeleton variant="rectangular" height={40} width={400} /><div style={{ marginTop: 16 }}><Skeleton variant="rectangular" height={300} /></div></div>;
  }

  if (error) {
    return <div style={{ padding: 24 }}><ErrorState error={error} onRetry={refetch} title="Failed to load interactions" /></div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Interaction History</h1>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ flex: 1, maxWidth: 360 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search interactions..." />
        </div>
        <Filter
          groups={[{ id: 'channel', label: 'Channel', type: 'checkbox', options: [
            { label: 'Phone', value: 'phone' }, { label: 'Email', value: 'email' },
            { label: 'Chat', value: 'chat' }, { label: 'Portal', value: 'portal' },
          ]}]}
          values={{ channel: channelFilter }}
          onChange={(id: string, value: string, checked: boolean) => { setChannelFilter(prev => checked ? [...prev, value] : prev.filter(v => v !== value)); setPage(1); }}
          onClear={() => { setChannelFilter([]); setPage(1); }}
        />
      </div>
      {data.length === 0 ? (
        <EmptyState title="No interactions" description="No customer interactions recorded." />
      ) : (
        <>
          <Table columns={columns} data={data} compact />
          {totalPages > 1 && <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}><Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} /></div>}
        </>
      )}
    </div>
  );
}
