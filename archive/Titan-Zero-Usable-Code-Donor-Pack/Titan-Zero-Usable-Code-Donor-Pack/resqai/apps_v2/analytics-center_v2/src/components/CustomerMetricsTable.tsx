import { Card, Table as SharedTable } from '../../../../shared/src/components';

interface CustomerMetricRow {
  customerName: string;
  segment: string;
  satisfaction: number;
  retention: string;
  status: string;
}

interface CustomerMetricsTableProps {
  rows: CustomerMetricRow[];
  title?: string;
  loading?: boolean;
  error?: string | null;
}

export function CustomerMetricsTable({ rows, title, loading, error }: CustomerMetricsTableProps) {
  if (error) return <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}><div style={{ color: '#ef4444', fontSize: 13, padding: 16 }}>{error}</div></Card>;
  if (loading) {
    return (
      <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
        {title && <div style={{ width: '40%', height: 14, background: '#243049', borderRadius: 4, marginBottom: 16 }} />}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '8px 0' }}>
            <div style={{ flex: 2, height: 12, background: '#243049', borderRadius: 4 }} />
            <div style={{ flex: 1, height: 12, background: '#243049', borderRadius: 4 }} />
            <div style={{ flex: 1, height: 12, background: '#243049', borderRadius: 4 }} />
            <div style={{ flex: 1, height: 12, background: '#243049', borderRadius: 4 }} />
          </div>
        ))}
      </Card>
    );
  }
  if (rows.length === 0) {
    return <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}><div style={{ color: '#6b7a95', fontSize: 13, textAlign: 'center', padding: 32 }}>No customer data</div></Card>;
  }

  const columns = [
    { key: 'customerName', label: 'Customer', width: '28%' },
    { key: 'segment', label: 'Segment', width: '18%' },
    { key: 'satisfaction', label: 'CSAT', width: '18%' },
    { key: 'retention', label: 'Retention', width: '18%' },
    { key: 'status', label: 'Status', width: '18%' },
  ];

  return (
    <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
      {title && <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 16 }}>{title}</div>}
      <SharedTable columns={columns} rows={rows.map((r) => ({ ...r, satisfaction: `${r.satisfaction}/5`, status: <span style={{ color: r.status === 'Healthy' ? '#22c55e' : r.status === 'At Risk' ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>{r.status}</span> }))} />
    </Card>
  );
}
