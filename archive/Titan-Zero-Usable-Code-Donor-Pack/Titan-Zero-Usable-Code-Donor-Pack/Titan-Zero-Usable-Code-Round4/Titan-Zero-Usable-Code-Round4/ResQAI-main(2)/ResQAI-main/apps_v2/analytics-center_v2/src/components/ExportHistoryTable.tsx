import { Card, Table as SharedTable, Button } from '../../../../shared/src/components';
import type { ExportHistoryItemVM } from '../models/view-models';

interface ExportHistoryTableProps {
  rows: ExportHistoryItemVM[];
  title?: string;
  loading?: boolean;
  error?: string | null;
  onDownload?: (id: string) => void;
}

export function ExportHistoryTable({ rows, title, loading, error, onDownload }: ExportHistoryTableProps) {
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
            <div style={{ width: 60, height: 24, background: '#243049', borderRadius: 4 }} />
          </div>
        ))}
      </Card>
    );
  }
  if (rows.length === 0) {
    return <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}><div style={{ color: '#6b7a95', fontSize: 13, textAlign: 'center', padding: 32 }}>No export history</div></Card>;
  }

  const columns = [
    { key: 'reportName', label: 'Report', width: '25%' },
    { key: 'format', label: 'Format', width: '12%' },
    { key: 'status', label: 'Status', width: '15%' },
    { key: 'requestedAt', label: 'Requested', width: '18%' },
    { key: 'fileSize', label: 'Size', width: '12%' },
    { key: 'actions', label: '', width: '18%' },
  ];

  const statusColor = (s: string) => s === 'completed' ? '#22c55e' : s === 'processing' ? '#fbbf24' : s === 'failed' ? '#ef4444' : '#6b7a95';

  return (
    <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
      {title && <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 16 }}>{title}</div>}
      <SharedTable
        columns={columns}
        rows={rows.map((r) => ({
          reportName: r.reportName,
          format: r.format.toUpperCase(),
          status: <span style={{ color: statusColor(r.status), fontWeight: 600, textTransform: 'capitalize' }}>{r.status}</span>,
          requestedAt: new Date(r.requestedAt).toLocaleDateString(),
          fileSize: r.fileSize || '-',
          actions: r.status === 'completed' && r.fileUrl ? (
            <Button variant="ghost" size="sm" onClick={() => onDownload?.(r.id)}>Download</Button>
          ) : '-',
        }))}
      />
    </Card>
  );
}
