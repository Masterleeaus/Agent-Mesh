import { Card, Table as SharedTable, ErrorState } from '../../../../shared/src/components';

interface KpiReportRow {
  metric: string;
  value: string;
  previousValue: string;
  change: string;
  trend: 'up' | 'down' | 'flat';
}

interface KpiReportTableProps {
  rows: KpiReportRow[];
  title?: string;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
}

export function KpiReportTable({ rows, title, loading, error, emptyMessage }: KpiReportTableProps) {
  if (error) return <ErrorState title="Failed to load" message={error} />;
  if (loading) {
    return (
      <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
        {title && <div style={{ width: '40%', height: 14, background: '#243049', borderRadius: 4, marginBottom: 16 }} />}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '8px 0' }}>
            <div style={{ flex: 2, height: 12, background: '#243049', borderRadius: 4 }} />
            <div style={{ flex: 1, height: 12, background: '#243049', borderRadius: 4 }} />
            <div style={{ flex: 1, height: 12, background: '#243049', borderRadius: 4 }} />
          </div>
        ))}
      </Card>
    );
  }
  if (rows.length === 0) {
    return (
      <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
        <div style={{ color: '#6b7a95', fontSize: 13, textAlign: 'center', padding: 32 }}>{emptyMessage || 'No KPI data available'}</div>
      </Card>
    );
  }

  const columns = [
    { key: 'metric', label: 'Metric', width: '40%' },
    { key: 'value', label: 'Current', width: '20%' },
    { key: 'previousValue', label: 'Previous', width: '20%' },
    { key: 'change', label: 'Change', width: '20%' },
  ];

  const trendArrow = (direction: string) => direction === 'up' ? '\u2191' : direction === 'down' ? '\u2193' : '\u2192';
  const trendColor = (direction: string) => direction === 'up' ? '#22c55e' : direction === 'down' ? '#ef4444' : '#8b9bb5';

  return (
    <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
      {title && <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 16 }}>{title}</div>}
      <SharedTable
        columns={columns}
        rows={rows.map((r) => ({
          ...r,
          change: <span style={{ color: trendColor(r.trend), fontWeight: 600 }}>{trendArrow(r.trend)} {r.change}</span>,
        }))}
      />
    </Card>
  );
}
