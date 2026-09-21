import { useState, type FC } from 'react';
import { Card, Table, Button, Dialog, Form, Input, Dropdown, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import type { TableColumn, DropdownOption, DialogSize } from '@resqai/foundation';
import { useTemplates } from '../hooks/useTemplates';
import { ticketService } from '../services/ticket-service';
import type { TemplateDTO } from '../models/dto';

const columns: TableColumn<TemplateDTO>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'category', header: 'Category' },
  { key: 'updatedAt', header: 'Last Updated' },
];

export const TemplatesPage: FC = () => {
  const { templates, loading, error, refetch } = useTemplates();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateDTO | null>(null);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('general');
  const [saving, setSaving] = useState(false);

  const categoryOptions: DropdownOption[] = [
    { value: 'general', label: 'General' },
    { value: 'greeting', label: 'Greeting' },
    { value: 'closing', label: 'Closing' },
    { value: 'billing', label: 'Billing' },
    { value: 'technical', label: 'Technical' },
  ];

  const openCreate = () => {
    setEditingTemplate(null);
    setName('');
    setBody('');
    setCategory('general');
    setDialogOpen(true);
  };

  const openEdit = (tpl: TemplateDTO) => {
    setEditingTemplate(tpl);
    setName(tpl.name);
    setBody(tpl.body);
    setCategory(tpl.category);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !body.trim()) return;
    setSaving(true);
    try {
      if (editingTemplate) {
        await ticketService.updateTemplate(editingTemplate.id, name, body, category);
      } else {
        await ticketService.createTemplate(name, body, category);
      }
      setDialogOpen(false);
      refetch();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this template?')) return;
    await ticketService.deleteTemplate(id);
    refetch();
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Templates</h1>
        <Button onClick={openCreate}>+ New Template</Button>
      </div>

      <Card variant="elevated" role="region" aria-label="Reply templates">
        {loading ? (
          <div style={{ padding: 16 }}>
            <Skeleton variant="rectangular" height={40} style={{ marginBottom: 8 }} />
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={48} style={{ marginBottom: 8 }} />)}
          </div>
        ) : error ? (
          <ErrorState title="Failed to load templates" message={error} onRetry={refetch} />
        ) : templates.length === 0 ? (
          <EmptyState title="No templates yet" description="Create your first reply template to speed up responses." action={<Button onClick={openCreate}>Create Template</Button>} />
        ) : (
          <Table columns={columns} data={templates as unknown as TemplateDTO[]} onRowClick={(row) => openEdit(row as unknown as TemplateDTO)} />
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editingTemplate ? 'Edit Template' : 'Create Template'} size="md">
        <Form onSubmit={(e) => { e.preventDefault(); handleSave(); }} layout="vertical">
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8b9bb5', fontWeight: 500 }}>Name</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Template name" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8b9bb5', fontWeight: 500 }}>Category</label>
              <Dropdown options={categoryOptions} value={category} onChange={v => setCategory(v as string)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8b9bb5', fontWeight: 500 }}>Body</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Template content..."
                rows={6}
                style={{
                  width: '100%', padding: 10, borderRadius: 8, border: '1px solid #243049',
                  background: '#131c2f', color: '#e6ecf5', fontSize: 13, resize: 'vertical',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </Form>
      </Dialog>
    </div>
  );
};
