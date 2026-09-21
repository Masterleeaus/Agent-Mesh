import { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { Card, Form, Button, Input, Dialog, Pagination, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import type { SystemSettingDTO } from '../models';
import { updateSetting } from '../services/admin-service';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };
const cardStyle: React.CSSProperties = { background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 20 };
const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #243049' };
const keyStyle: React.CSSProperties = { color: '#e6ecf5', fontSize: 14, fontWeight: 500, fontFamily: 'monospace' };
const valStyle: React.CSSProperties = { color: '#8b9bb5', fontSize: 13, marginTop: 2 };
const labelStyle: React.CSSProperties = { color: '#8b9bb5', fontSize: 12 };

export function SystemSettingsPage() {
  const { data, loading, error } = useSettings();
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.ceil(data.length / pageSize);
  const pageData = data.slice((page - 1) * pageSize, page * pageSize);

  const openEdit = (s: SystemSettingDTO) => { setEditKey(s.key); setEditValue(s.value); };
  const handleSave = async () => {
    if (!editKey) return;
    setSaving(true);
    try { await updateSetting(editKey, { key: editKey, value: editValue }); setEditKey(null); } finally { setSaving(false); }
  };

  if (error) return <ErrorState title="Failed to load settings" message={error} />;

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>System Settings</span>
      </div>
      {loading && data.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3].map(i => <Skeleton key={i} variant="card" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState title="No settings" description="No system settings configured." />
      ) : (
        <>
          <Card style={cardStyle}>
            {pageData.map(s => (
              <div key={s.id} style={rowStyle}>
                <div>
                  <div style={keyStyle}>{s.key}</div>
                  <div style={valStyle}>{s.value}</div>
                  <div style={labelStyle}>{s.description}</div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => openEdit(s)}>Edit</Button>
              </div>
            ))}
          </Card>
          {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
        </>
      )}
      <Dialog open={!!editKey} onClose={() => setEditKey(null)} title={`Edit: ${editKey}`} size="sm">
        <Input value={editValue} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)} placeholder="Value" />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <Button variant="secondary" onClick={() => setEditKey(null)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving} disabled={saving}>Save</Button>
        </div>
      </Dialog>
    </div>
  );
}
