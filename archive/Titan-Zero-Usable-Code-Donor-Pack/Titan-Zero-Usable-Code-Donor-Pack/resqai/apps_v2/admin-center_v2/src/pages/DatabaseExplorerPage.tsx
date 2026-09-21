import { useState } from 'react';
import { Card, Table, Button, Input } from '@resqai/foundation';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };
const cardStyle: React.CSSProperties = { background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 24 };

const tables = [
  { name: 'users', rows: 142, size: '2.4 MB' },
  { name: 'tickets', rows: 15230, size: '48.2 MB' },
  { name: 'workflow_runs', rows: 8450, size: '12.1 MB' },
  { name: 'function_runs', rows: 12400, size: '18.5 MB' },
  { name: 'audit_logs', rows: 28500, size: '36.8 MB' },
  { name: 'events', rows: 45200, size: '52.3 MB' },
  { name: 'notifications', rows: 8900, size: '4.2 MB' },
  { name: 'sessions', rows: 3200, size: '1.8 MB' },
];

export function DatabaseExplorerPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const executeQuery = () => {
    if (!query.trim()) return;
    setResult(`Query executed: ${query}\nAffected rows: 0\nDuration: 2ms\n(Read-only mode - mock response)`);
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Database Explorer</span>
        <span style={{ color: '#ef5350', fontSize: 12, background: '#2a1a1a', padding: '4px 10px', borderRadius: 4 }}>READ ONLY</span>
      </div>
      <Card style={cardStyle}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#e6ecf5', marginBottom: 12 }}>Tables</div>
        <Table
          columns={[
            { key: 'name', header: 'Table Name', render: (_v: unknown, r: any) => r.name, sortable: true },
            { key: 'rows', header: 'Rows', render: (_v: unknown, r: any) => r.rows.toLocaleString(), sortable: true },
            { key: 'size', header: 'Size', render: (_v: unknown, r: any) => r.size, sortable: true },
          ]}
          data={tables.map((t, i) => ({ ...t, id: String(i) }))}
          emptyMessage="No tables"
          sortable
        />
      </Card>
      <Card style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 8 }}>SQL Query</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <Input value={query} onChange={(e: any) => setQuery(e.target.value)} placeholder="SELECT * FROM users LIMIT 10" style={{ flex: 1, fontFamily: 'monospace' }} />
          <Button onClick={executeQuery} disabled={!query.trim()}>Execute</Button>
        </div>
        {result && (
          <pre style={{ background: '#0b1220', border: '1px solid #243049', borderRadius: 6, padding: 12, color: '#c0ccdc', fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {result}
          </pre>
        )}
      </Card>
    </div>
  );
}
