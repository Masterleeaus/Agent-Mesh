import { useMemo } from 'react';
import { useEventBusMetrics } from '../hooks/useEventBusMetrics';
import { Card, Table, StatusBadge, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import type { EventBusMetricDTO, EventStatus } from '../models';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 };
const statCardStyle: React.CSSProperties = { background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 20, display: 'flex', flexDirection: 'column', gap: 4 };
const statValueStyle: React.CSSProperties = { fontSize: 28, fontWeight: 700, color: '#e6ecf5' };
const statLabelStyle: React.CSSProperties = { fontSize: 13, color: '#8b9bb5' };

const statusVariant: Record<EventStatus, 'success' | 'error' | 'warning' | 'neutral'> = { success: 'success', failed: 'error', pending: 'neutral', retrying: 'warning' };

export function EventBusMonitorPage() {
  const { data, recentEvents, loading, error } = useEventBusMetrics();

  if (loading) return <div style={pageStyle}>
    <div style={gridStyle}>{[1,2,3,4].map(i => <Skeleton key={i} variant="card" />)}</div>
    <Skeleton variant="card" />
  </div>;

  if (error) return <ErrorState title="Failed to load event bus metrics" message={error} />;
  if (!data) return <EmptyState title="No events" description="No event bus data available." />;

  return (
    <div style={pageStyle}>
      <div style={titleStyle}>Event Bus Monitor</div>
      <div style={gridStyle}>
        <Card style={statCardStyle}><span style={statValueStyle}>{data.totalEvents.toLocaleString()}</span><span style={statLabelStyle}>Total Events</span></Card>
        <Card style={statCardStyle}><span style={statValueStyle}>{data.successRate}%</span><span style={statLabelStyle}>Success Rate</span></Card>
        <Card style={statCardStyle}><span style={statValueStyle}>{data.failedCount}</span><span style={statLabelStyle}>Failed Events</span></Card>
        <Card style={statCardStyle}><span style={statValueStyle}>{data.retryQueueSize}</span><span style={statLabelStyle}>Retry Queue</span></Card>
      </div>
      <Card style={{ background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#e6ecf5', marginBottom: 12 }}>Events by Type</div>
        <Table
          columns={[
            { key: 'type', header: 'Event Type', render: (_v: unknown, r: { id: string; type: string; count: number; failed: number }) => r.type },
            { key: 'count', header: 'Total', render: (_v: unknown, r: { id: string; type: string; count: number; failed: number }) => r.count, sortable: true },
            { key: 'failed', header: 'Failed', render: (_v: unknown, r: { id: string; type: string; count: number; failed: number }) => r.failed, sortable: true },
            { key: 'health', header: 'Status', render: (_v: unknown, r: { id: string; type: string; count: number; failed: number }) => <StatusBadge variant={r.failed > 0 ? 'warning' : 'success'} size="sm">{r.failed > 0 ? 'Degraded' : 'Healthy'}</StatusBadge> },
          ]}
          data={data.eventsByType.map((e, i) => ({ ...e, id: String(i) }))}
          emptyMessage="No event types"
        />
      </Card>
      <Card style={{ background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#e6ecf5', marginBottom: 12 }}>Recent Events</div>
        {recentEvents.length === 0 ? (
          <EmptyState title="No events" description="No recent events recorded." />
        ) : (
          <Table
            columns={[
              { key: 'timestamp', header: 'Time', render: (_v: unknown, r: EventBusMetricDTO) => new Date(r.timestamp).toLocaleString() },
              { key: 'eventType', header: 'Type', render: (_v: unknown, r: EventBusMetricDTO) => r.eventType },
              { key: 'source', header: 'Source', render: (_v: unknown, r: EventBusMetricDTO) => r.source },
              { key: 'status', header: 'Status', render: (_v: unknown, r: EventBusMetricDTO) => <StatusBadge variant={statusVariant[r.status]} size="sm">{r.status}</StatusBadge> },
              { key: 'retries', header: 'Retries', render: (_v: unknown, r: EventBusMetricDTO) => r.retryCount },
            ]}
            data={recentEvents.map(e => ({ ...e, id: e.id }))}
            emptyMessage="No events"
          />
        )}
      </Card>
    </div>
  );
}
