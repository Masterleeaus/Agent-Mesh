import { useState, type FC } from 'react';
import { Card, Button, StatusBadge, Skeleton, EmptyState, Pagination, SearchBar, Filter } from '@resqai/foundation';
import type { FilterGroup } from '@resqai/foundation';
import { useJobs } from '../hooks/useJobs';
import type { JobListItemVM } from '../models/view-models';

const filterGroups: FilterGroup[] = [
  {
    id: 'status',
    label: 'Status',
    type: 'checkbox',
    options: [
      { label: 'Assigned', value: 'assigned' },
      { label: 'En Route', value: 'en_route' },
      { label: 'On Site', value: 'on_site' },
      { label: 'In Progress', value: 'in_progress' },
      { label: 'Paused', value: 'paused' },
      { label: 'Completed', value: 'completed' },
      { label: 'Escalated', value: 'escalated' },
    ],
  },
  {
    id: 'priority',
    label: 'Priority',
    type: 'checkbox',
    options: [
      { label: 'Low', value: 'low' },
      { label: 'Normal', value: 'normal' },
      { label: 'High', value: 'high' },
      { label: 'Urgent', value: 'urgent' },
    ],
  },
  {
    id: 'serviceType',
    label: 'Service Type',
    type: 'checkbox',
    options: [
      { label: 'Installation', value: 'installation' },
      { label: 'Repair', value: 'repair' },
      { label: 'Maintenance', value: 'maintenance' },
      { label: 'Inspection', value: 'inspection' },
      { label: 'Emergency', value: 'emergency' },
      { label: 'Follow-up', value: 'follow_up' },
    ],
  },
];

export const TodayJobsPage: FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({});
  const today = new Date().toISOString().split('T')[0];

  const filterParams: Record<string, unknown> = { page, pageSize: 25, search, dateFrom: today, dateTo: today };
  Object.entries(filterValues).forEach(([key, vals]) => {
    if (vals.length > 0) filterParams[key] = vals;
  });

  const { jobs, total, loading, error, refetch } = useJobs(filterParams as Parameters<typeof useJobs>[0]);
  const totalPages = Math.max(1, Math.ceil(total / 25));

  const handleFilterChange = (groupId: string, value: string, checked: boolean) => {
    setFilterValues(prev => ({
      ...prev,
      [groupId]: checked ? [...(prev[groupId] || []), value] : (prev[groupId] || []).filter(v => v !== value),
    }));
    setPage(1);
  };

  const handleJobClick = (id: string) => { window.location.hash = `#/jobs/${id}`; };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Today's Jobs</h1>

      <Card variant="bordered" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search today's jobs..." aria-label="Search jobs" />
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 220, flexShrink: 0 }}>
          <Card variant="bordered" role="region" aria-label="Filters">
            <Filter groups={filterGroups} values={filterValues} onChange={handleFilterChange} onClear={() => setFilterValues({})} />
          </Card>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading && (
            <div role="status" aria-label="Loading jobs">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={80} style={{ marginBottom: 8 }} />)}
            </div>
          )}
          {!loading && error && (
            <Card variant="bordered" style={{ padding: 24, textAlign: 'center' }}>
              <p style={{ color: '#ff6b6b' }}>{error}</p>
              <Button size="sm" onClick={refetch}>Retry</Button>
            </Card>
          )}
          {!loading && !error && jobs.length === 0 && (
            <EmptyState title="No jobs today" description="No jobs scheduled for today." />
          )}
          {!loading && !error && jobs.map(job => (
            <Card key={job.id} variant="bordered" onClick={() => handleJobClick(job.id)} style={{ cursor: 'pointer', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: job.priority === 'urgent' ? '#ff6b6b' : job.priority === 'high' ? '#f0c040' : '#4ecdc4' }} />
                    <span style={{ fontWeight: 600, color: '#e6ecf5' }}>{job.title}</span>
                  </div>
                  <span style={{ fontSize: 13, color: '#8b9bb5' }}>{job.customerName}</span>
                  <span style={{ fontSize: 12, color: '#5a6a85', marginLeft: 8 }}>{job.customerAddress}</span>
                </div>
                <StatusBadge variant={job.status === 'completed' ? 'success' : job.status === 'escalated' ? 'error' : 'info'}>
                  {job.status.replace('_', ' ')}
                </StatusBadge>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: '#5a6a85' }}>
                <span>{new Date(job.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(job.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span>{job.estimatedDuration} min</span>
                <span>{job.serviceType.replace('_', ' ')}</span>
              </div>
            </Card>
          ))}
          {totalPages > 1 && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
