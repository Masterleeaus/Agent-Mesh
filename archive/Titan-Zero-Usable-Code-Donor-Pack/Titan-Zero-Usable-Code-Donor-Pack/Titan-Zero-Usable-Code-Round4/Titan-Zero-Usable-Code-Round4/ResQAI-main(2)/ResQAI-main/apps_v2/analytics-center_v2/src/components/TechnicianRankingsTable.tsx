import { Card, Table as SharedTable } from '../../../../shared/src/components';

interface TechnicianRankRow {
  rank: number;
  name: string;
  appointments: number;
  completionRate: string;
  satisfaction: number;
  productivity: number;
}

interface TechnicianRankingsTableProps {
  rows: TechnicianRankRow[];
  title?: string;
  loading?: boolean;
  error?: string | null;
}

export function TechnicianRankingsTable({ rows, title, loading, error }: TechnicianRankingsTableProps) {
  if (error) return <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}><div style={{ color: '#ef4444', fontSize: 13, padding: 16 }}>{error}</div></Card>;
  if (loading) {
    return (
      <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
        {title && <div style={{ width: '40%', height: 14, background: '#243049', borderRadius: 4, marginBottom: 16 }} />}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '8px 0' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#243049' }} />
            <div style={{ flex: 2, height: 12, background: '#243049', borderRadius: 4 }} />
            <div style={{ flex: 1, height: 12, background: '#243049', borderRadius: 4 }} />
            <div style={{ flex: 1, height: 12, background: '#243049', borderRadius: 4 }} />
          </div>
        ))}
      </Card>
    );
  }
  if (rows.length === 0) {
    return <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}><div style={{ color: '#6b7a95', fontSize: 13, textAlign: 'center', padding: 32 }}>No technician data</div></Card>;
  }

  const columns = [
    { key: 'rank', label: '#', width: '8%' },
    { key: 'name', label: 'Technician', width: '28%' },
    { key: 'appointments', label: 'Appointments', width: '16%' },
    { key: 'completionRate', label: 'Completion', width: '16%' },
    { key: 'satisfaction', label: 'CSAT', width: '16%' },
    { key: 'productivity', label: 'Productivity', width: '16%' },
  ];

  return (
    <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
      {title && <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 16 }}>{title}</div>}
      <SharedTable columns={columns} rows={rows.map((r) => ({ ...r, rank: `#${r.rank}`, productivity: `${r.productivity}/100` }))} />
    </Card>
  );
}
