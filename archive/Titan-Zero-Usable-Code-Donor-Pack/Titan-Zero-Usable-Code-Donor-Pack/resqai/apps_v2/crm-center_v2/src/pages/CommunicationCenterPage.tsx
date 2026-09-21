import { useCommunication } from '../hooks/useCommunication';
import { useInteractions } from '../hooks/useInteractions';
import { Card, StatusBadge, Skeleton, EmptyState, ErrorState, Button, Table } from '../../../../shared/src/components';
import type { TableColumn } from '../../../../shared/src/components';
import type { InteractionDTO } from '../models/dto';

export default function CommunicationCenterPage() {
  const comms = useCommunication();
  const interactions = useInteractions();

  if (comms.loading) {
    return <div style={{ padding: 24 }}><Skeleton variant="rectangular" height={40} width={300} /><div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{[1, 2].map(i => <Skeleton key={i} variant="card" height={200} />)}</div></div>;
  }

  if (comms.error) {
    return <div style={{ padding: 24 }}><ErrorState error={comms.error} onRetry={comms.refetch} title="Failed to load communication data" /></div>;
  }

  const channelColors: Record<string, string> = { phone: '#3b82f6', email: '#16a34a', chat: '#f59e0b', portal: '#8b5cf6', in_person: '#41d1c4' };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: '0 0 16px 0' }}>Communication Center</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        <Card style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }}>{comms.data?.pendingOutreach || 0}</div>
          <div style={{ fontSize: 12, color: '#8b9bb5' }}>Pending Outreach</div>
        </Card>
        <Card style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#41d1c4' }}>{interactions.data.length}</div>
          <div style={{ fontSize: 12, color: '#8b9bb5' }}>Total Interactions</div>
        </Card>
        {comms.data?.channelsBreakdown.map((c: { channel: string; count: number }) => (
          <Card key={c.channel} style={{ background: '#131c2f', border: '1px solid #243049' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: channelColors[c.channel] || '#6b7280' }}>{c.count}</div>
            <div style={{ fontSize: 12, color: '#8b9bb5', textTransform: 'capitalize' }}>{c.channel.replace('_', ' ')}</div>
          </Card>
        ))}
      </div>

      <Card style={{ background: '#131c2f', border: '1px solid #243049', marginBottom: 16 }} header={<span style={{ fontWeight: 600, color: '#e6ecf5', fontSize: 14 }}>Recent Communications</span>}>
        {interactions.data.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>No recent communications</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {interactions.data.slice(0, 5).map((i: InteractionDTO) => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #243049', fontSize: 13 }}>
                <div>
                  <span style={{ color: '#e6ecf5', fontWeight: 500 }}>{i.customerName}</span>
                  <span style={{ color: '#8b9bb5', marginLeft: 8 }}>{i.subject}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <StatusBadge variant="info" size="sm">{i.channel}</StatusBadge>
                  <span style={{ color: directionColor(i.direction), fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{i.direction}</span>
                  <span style={{ color: '#8b9bb5', fontSize: 11 }}>{new Date(i.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function directionColor(dir: string): string {
  return dir === 'inbound' ? '#3b82f6' : '#f59e0b';
}
