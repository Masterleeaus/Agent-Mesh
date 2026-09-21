import { useState, type FC } from 'react';
import { Card, Button, StatusBadge, Skeleton, EmptyState, Pagination, SearchBar } from '@resqai/foundation';
import { useJobs } from '../hooks/useJobs';

export const UpcomingJobsPage: FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const today = new Date().toISOString().split('T')[0];

  const filterParams: Record<string, unknown> = {
    page, pageSize: 25, search,
    status: ['assigned'],
    dateFrom: today,
  };

  const { jobs, total, loading, error, refetch } = useJobs(filterParams as Parameters<typeof useJobs>[0]);
  const totalPages = Math.max(1, Math.ceil(total / 25));

  const handleJobClick = (id: string) => { window.location.hash = `#/jobs/${id}`; };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Upcoming Jobs</h1>
      <Card variant="bordered" style={{ marginBottom: 16 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search upcoming jobs..." />
      </Card>

      {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={80} style={{ marginBottom: 8 }} />)}
      {!loading && error && (
        <Card variant="bordered" style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ color: '#ff6b6b' }}>{error}</p>
          <Button size="sm" onClick={refetch}>Retry</Button>
        </Card>
      )}
      {!loading && !error && jobs.length === 0 && <EmptyState title="No upcoming jobs" description="No upcoming jobs scheduled." />}
      {!loading && !error && jobs.map(job => (
        <Card key={job.id} variant="bordered" onClick={() => handleJobClick(job.id)} style={{ cursor: 'pointer', marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: '#e6ecf5' }}>{job.title}</span>
              </div>
              <span style={{ fontSize: 13, color: '#8b9bb5' }}>{job.customerName} — {job.customerAddress}</span>
            </div>
            <StatusBadge variant="info">{job.status.replace('_', ' ')}</StatusBadge>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: '#5a6a85' }}>
            <span>{new Date(job.scheduledStart).toLocaleDateString()} {new Date(job.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
  );
};
