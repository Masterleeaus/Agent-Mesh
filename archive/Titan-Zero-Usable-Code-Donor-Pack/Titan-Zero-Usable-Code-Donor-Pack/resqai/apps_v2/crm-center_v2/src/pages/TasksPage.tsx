import { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { Table, Filter, StatusBadge, Pagination, Skeleton, EmptyState, ErrorState, Button, Card } from '../../../../shared/src/components';
import type { TableColumn } from '../../../../shared/src/components';
import type { TaskDTO } from '../models/dto';

const statusColors: Record<string, 'info' | 'warning' | 'success' | 'error'> = { open: 'info', in_progress: 'warning', completed: 'success', blocked: 'error' };
const priorityColors: Record<string, string> = { low: '#6b7280', medium: '#3b82f6', high: '#f59e0b', critical: '#ef4444' };

export default function TasksPage() {
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const { data, total, loading, error, refetch } = useTasks();

  const columns: TableColumn<TaskDTO>[] = [
    { key: 'title', header: 'Title', render: (_v: unknown, row: TaskDTO) => <span style={{ color: '#41d1c4', fontWeight: 500 }}>{row.title}</span> },
    { key: 'accountId', header: 'Account', render: (_v: unknown, row: TaskDTO) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{row.accountId}</span> },
    { key: 'priority', header: 'Priority', render: (_v: unknown, row: TaskDTO) => <span style={{ color: priorityColors[row.priority] || '#6b7280', fontWeight: 600, fontSize: 12 }}>{row.priority}</span> },
    { key: 'status', header: 'Status', render: (_v: unknown, row: TaskDTO) => <StatusBadge variant={statusColors[row.status] || 'neutral'} size="sm">{row.status.replace('_', ' ')}</StatusBadge> },
    { key: 'dueDate', header: 'Due Date', render: (_v: unknown, row: TaskDTO) => row.dueDate ? <span style={{ color: new Date(row.dueDate) < new Date() && row.status !== 'completed' ? '#ef4444' : '#8b9bb5', fontSize: 12 }}>{new Date(row.dueDate).toLocaleDateString()}</span> : <span style={{ color: '#6b7280', fontSize: 12 }}>—</span> },
    { key: 'assigneeName', header: 'Assignee' },
    { key: 'createdAt', header: 'Created', render: (_v: unknown, row: TaskDTO) => <span style={{ color: '#8b9bb5', fontSize: 12 }}>{new Date(row.createdAt).toLocaleDateString()}</span> },
  ];

  if (loading) {
    return <div style={{ padding: 24 }}><Skeleton variant="rectangular" height={40} width={400} /><div style={{ marginTop: 16 }}><Skeleton variant="rectangular" height={300} /></div></div>;
  }

  if (error) {
    return <div style={{ padding: 24 }}><ErrorState error={error} onRetry={refetch} title="Failed to load tasks" /></div>;
  }

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Tasks</h1>
        <Button variant="primary" size="sm" onClick={() => window.location.hash = '#/tasks/new'}>Create Task</Button>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Filter groups={[{ id: 'status', label: 'Status', type: 'checkbox', options: [
          { label: 'Open', value: 'open' }, { label: 'In Progress', value: 'in_progress' },
          { label: 'Completed', value: 'completed' }, { label: 'Blocked', value: 'blocked' },
        ]}]} values={{ status: statusFilter }}
          onChange={(id: string, value: string, checked: boolean) => { setStatusFilter(prev => checked ? [...prev, value] : prev.filter(v => v !== value)); setPage(1); }}
          onClear={() => { setStatusFilter([]); setPage(1); }} />
        <Filter groups={[{ id: 'priority', label: 'Priority', type: 'checkbox', options: [
          { label: 'Low', value: 'low' }, { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' }, { label: 'Critical', value: 'critical' },
        ]}]} values={{ priority: priorityFilter }}
          onChange={(id: string, value: string, checked: boolean) => { setPriorityFilter(prev => checked ? [...prev, value] : prev.filter(v => v !== value)); setPage(1); }}
          onClear={() => { setPriorityFilter([]); setPage(1); }} />
      </div>
      {data.length === 0 ? (
        <EmptyState title="No tasks" description="No tasks found." action={<Button variant="primary" onClick={() => window.location.hash = '#/tasks/new'}>Create Task</Button>} />
      ) : (
        <>
          <Table columns={columns} data={data} compact />
          {totalPages > 1 && <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}><Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} /></div>}
        </>
      )}
    </div>
  );
}
