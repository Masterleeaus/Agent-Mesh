import { useState } from 'react';
import { useNotes } from '../hooks/useNotes';
import { Card, Button, Skeleton, EmptyState, ErrorState, StatusBadge, Filter, Input } from '../../../../shared/src/components';
import type { NoteDTO } from '../models/dto';

const categoryColors: Record<string, string> = { general: '#6b7280', account: '#3b82f6', support: '#8b5cf6', billing: '#f59e0b', meeting: '#16a34a' };

export default function NotesPage() {
  const { data, loading, error, refetch } = useNotes();
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  if (loading) {
    return <div style={{ padding: 24 }}><Skeleton variant="rectangular" height={40} width={300} /><div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>{[1, 2, 3].map(i => <Skeleton key={i} variant="card" height={100} />)}</div></div>;
  }

  if (error) {
    return <div style={{ padding: 24 }}><ErrorState error={error} onRetry={refetch} title="Failed to load notes" /></div>;
  }

  let filtered = data;
  if (categoryFilter.length) filtered = filtered.filter((n: NoteDTO) => categoryFilter.includes(n.category));
  if (showPinnedOnly) filtered = filtered.filter((n: NoteDTO) => n.pinned);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Notes</h1>
        <Button variant="primary" size="sm" onClick={() => window.location.hash = '#/notes/new'}>Add Note</Button>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <Filter groups={[{ id: 'category', label: 'Category', type: 'checkbox', options: [
          { label: 'General', value: 'general' }, { label: 'Account', value: 'account' },
          { label: 'Support', value: 'support' }, { label: 'Billing', value: 'billing' }, { label: 'Meeting', value: 'meeting' },
        ]}]} values={{ category: categoryFilter }}
          onChange={(id: string, value: string, checked: boolean) => setCategoryFilter(prev => checked ? [...prev, value] : prev.filter(v => v !== value))}
          onClear={() => setCategoryFilter([])} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#8b9bb5', cursor: 'pointer' }}>
          <input type="checkbox" checked={showPinnedOnly} onChange={(e) => setShowPinnedOnly(e.target.checked)} style={{ accentColor: '#41d1c4' }} />
          Pinned only
        </label>
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="No notes" description="No notes found matching your criteria." action={<Button variant="primary" onClick={() => window.location.hash = '#/notes/new'}>Add Note</Button>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((note: NoteDTO) => (
            <Card key={note.id} style={{ background: '#131c2f', border: note.pinned ? '1px solid #f59e0b' : '1px solid #243049' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>{note.title}</span>
                  <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, backgroundColor: `${categoryColors[note.category]}22`, color: categoryColors[note.category] }}>{note.category}</span>
                  {note.pinned && <span style={{ color: '#f59e0b', fontSize: 11 }}>📌</span>}
                </div>
                <span style={{ fontSize: 11, color: '#8b9bb5' }}>{note.authorName} · {new Date(note.createdAt).toLocaleDateString()}</span>
              </div>
              <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{note.content}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
