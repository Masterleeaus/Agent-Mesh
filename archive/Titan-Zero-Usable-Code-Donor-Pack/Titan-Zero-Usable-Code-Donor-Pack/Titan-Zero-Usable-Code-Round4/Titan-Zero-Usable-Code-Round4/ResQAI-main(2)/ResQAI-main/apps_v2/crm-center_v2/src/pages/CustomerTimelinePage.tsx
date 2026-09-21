import { useState } from 'react';
import { useInteractions } from '../hooks/useInteractions';
import { Card, Skeleton, EmptyState, ErrorState, StatusBadge, Filter } from '../../../../shared/src/components';
import { AccountTimeline } from '../components/AccountTimeline';
import type { InteractionDTO } from '../models/dto';

export default function CustomerTimelinePage() {
  const { data, loading, error, refetch } = useInteractions();
  const [channelFilter, setChannelFilter] = useState<string[]>([]);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton variant="rectangular" height={40} width={300} />
        <div style={{ marginTop: 16 }}><Skeleton variant="card" height={400} /></div>
      </div>
    );
  }

  if (error) {
    return <div style={{ padding: 24 }}><ErrorState error={error} onRetry={refetch} title="Failed to load timeline" /></div>;
  }

  const filtered = channelFilter.length
    ? data.filter((i: InteractionDTO) => channelFilter.includes(i.channel))
    : data;

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: '0 0 16px 0' }}>Customer Timeline</h1>
      <div style={{ marginBottom: 16 }}>
        <Filter
          groups={[{ id: 'channel', label: 'Channel', type: 'checkbox', options: [
            { label: 'Phone', value: 'phone' }, { label: 'Email', value: 'email' },
            { label: 'Chat', value: 'chat' }, { label: 'In Person', value: 'in_person' },
          ]}]}
          values={{ channel: channelFilter }}
          onChange={(id: string, value: string, checked: boolean) => setChannelFilter(prev => checked ? [...prev, value] : prev.filter(v => v !== value))}
          onClear={() => setChannelFilter([])}
        />
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="No timeline events" description="No customer interactions recorded yet." />
      ) : (
        <Card style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <AccountTimeline events={filtered.map(i => ({
            id: i.id, type: i.channel, description: `${i.subject} — ${i.summary}`,
            timestamp: i.createdAt, actor: i.agentName,
          }))} />
        </Card>
      )}
    </div>
  );
}
