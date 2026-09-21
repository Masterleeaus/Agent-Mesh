import { Card, Table as SharedTable } from '../../../../shared/src/components';

interface SLAReportRow {
  domain: string;
  target: string;
  actual: string;
  status: string;
  breaches: number;
}

interface SLAReportsTableProps {
  rows: SLAReportRow[];
  title?: string;
  loading?: boolean;
  error?: string | null;
}

export function SLAReportsTable({ rows, title, loading, error }: SLAReportsTableProps) {
  if (error) return <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}><div style={{ color: '#ef4444', fontSize: 13, padding: 16 }}>{error}</div></Card>;
  if (loading) {
    return (
      <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
        {title && <div style={{ width: '40%', height: 14, background: '#243049', borderRadius: 4, marginBottom: 16 }} />}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '8px 0' }}>
            <div style={{ flex: 1, height: 12, background: '#243049', borderRadius: 4 }} />
            <div style={{ flex: 1, height: 12, background: '#243049', borderRadius: 4 }} />
            <div style={{ flex: 1, height: 12, background: '#243049', borderRadius: 4 }} />
            <div style={{ flex: 1, height: 12, background: '#243049', borderRadius: 4 }} />
          </div>
        ))}
      </Card>
    );
  }
  if (rows.length === 0) {
    return <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}><div style={{ color: '#6b7a95', fontSize: 13, textAlign: 'center', padding: 32 }}>No SLA data</div></Card>;
  }

  const columns = [
    { key: 'domain', label: 'Domain', width: '25%' },
    { key: 'target', label: 'Target', width: '20%' },
    { key: 'actual', label: 'Actual', width: '20%' },
    { key: 'status', label: 'Status', width: '20%' },
    { key: 'breaches', label: 'Breaches', width: '15%' },
  ];

  const statusColor = (s: string) => s === 'Compliant' ? '#22c55e' : s === 'Warning' ? '#f59e0b' : '#ef4444';

  return (
    <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
      {title && <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 16 }}>{title}</div>}
      <SharedTable columns={columns} rows={rows.map((r) => ({ ...r, status: <span style={{ color: statusColor(r.status), fontWeight: 600 }}>{r.status}</span> }))} />
    </Card>
  );
}
