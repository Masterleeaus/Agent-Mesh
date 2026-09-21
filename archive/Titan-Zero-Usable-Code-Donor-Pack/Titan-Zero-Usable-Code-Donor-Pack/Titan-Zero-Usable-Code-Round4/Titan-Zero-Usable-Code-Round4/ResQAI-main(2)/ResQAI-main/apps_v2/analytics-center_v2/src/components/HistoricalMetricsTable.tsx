import { Card, Table as SharedTable } from '../../../../shared/src/components';

interface HistoricalMetricRow {
  date: string;
  metric: string;
  value: number;
  change: string;
}

interface HistoricalMetricsTableProps {
  rows: HistoricalMetricRow[];
  title?: string;
  loading?: boolean;
  error?: string | null;
}

export function HistoricalMetricsTable({ rows, title, loading, error }: HistoricalMetricsTableProps) {
  if (error) return <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}><div style={{ color: '#ef4444', fontSize: 13, padding: 16 }}>{error}</div></Card>;
  if (loading) {
    return (
      <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
        {title && <div style={{ width: '40%', height: 14, background: '#243049', borderRadius: 4, marginBottom: 16 }} />}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '8px 0' }}>
            <div style={{ flex: 1, height: 12, background: '#243049', borderRadius: 4 }} />
            <div style={{ flex: 1, height: 12, background: '#243049', borderRadius: 4 }} />
            <div style={{ flex: 1, height: 12, background: '#243049', borderRadius: 4 }} />
          </div>
        ))}
      </Card>
    );
  }
  if (rows.length === 0) {
    return <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}><div style={{ color: '#6b7a95', fontSize: 13, textAlign: 'center', padding: 32 }}>No historical data available</div></Card>;
  }

  const columns = [
    { key: 'date', label: 'Date', width: '25%' },
    { key: 'metric', label: 'Metric', width: '25%' },
    { key: 'value', label: 'Value', width: '25%' },
    { key: 'change', label: 'Change', width: '25%' },
  ];

  return (
    <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
      {title && <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 16 }}>{title}</div>}
      <SharedTable columns={columns} rows={rows} />
    </Card>
  );
}
