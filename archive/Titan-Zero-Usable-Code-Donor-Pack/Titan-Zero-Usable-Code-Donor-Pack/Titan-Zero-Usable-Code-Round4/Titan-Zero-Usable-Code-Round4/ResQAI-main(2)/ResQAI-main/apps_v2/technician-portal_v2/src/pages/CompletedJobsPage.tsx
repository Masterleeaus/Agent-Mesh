import { useState, type FC } from 'react';
import { Card, Button, StatusBadge, Skeleton, EmptyState, Pagination, SearchBar } from '@resqai/foundation';
import { useJobs } from '../hooks/useJobs';

export const CompletedJobsPage: FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filterParams: Record<string, unknown> = {
    page, pageSize: 25, search,
    status: ['completed'],
  };

  const { jobs, total, loading, error, refetch } = useJobs(filterParams as Parameters<typeof useJobs>[0]);
  const totalPages = Math.max(1, Math.ceil(total / 25));

  const handleJobClick = (id: string) => { window.location.hash = `#/jobs/${id}`; };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Completed Jobs</h1>
      <Card variant="bordered" style={{ marginBottom: 16 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search completed jobs..." />
      </Card>

      {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={80} style={{ marginBottom: 8 }} />)}
      {!loading && error && (
        <Card variant="bordered" style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ color: '#ff6b6b' }}>{error}</p>
          <Button size="sm" onClick={refetch}>Retry</Button>
        </Card>
      )}
      {!loading && !error && jobs.length === 0 && <EmptyState title="No completed jobs" description="No jobs have been completed yet." />}
      {!loading && !error && jobs.map(job => (
        <Card key={job.id} variant="bordered" onClick={() => handleJobClick(job.id)} style={{ cursor: 'pointer', marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontWeight: 600, color: '#e6ecf5' }}>{job.title}</span>
              <div style={{ fontSize: 12, color: '#8b9bb5', marginTop: 2 }}>{job.customerName}</div>
            </div>
            <StatusBadge variant="success">Completed</StatusBadge>
          </div>
          <div style={{ fontSize: 11, color: '#5a6a85', marginTop: 6 }}>
            {job.serviceType.replace('_', ' ')} &middot; {new Date(job.scheduledStart).toLocaleDateString()}
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
