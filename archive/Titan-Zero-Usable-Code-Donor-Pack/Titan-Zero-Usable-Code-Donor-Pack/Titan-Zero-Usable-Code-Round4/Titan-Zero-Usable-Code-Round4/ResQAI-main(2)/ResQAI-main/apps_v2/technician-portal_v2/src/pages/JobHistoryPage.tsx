import { useState, type FC } from 'react';
import { Card, Button, StatusBadge, Skeleton, EmptyState, Pagination, SearchBar } from '@resqai/foundation';
import { useJobs } from '../hooks/useJobs';

export const JobHistoryPage: FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filterParams: Record<string, unknown> = {
    page, pageSize: 25, search,
    status: ['completed'],
  };

  const { jobs, total, loading, error, refetch } = useJobs(filterParams as Parameters<typeof useJobs>[0]);
  const totalPages = Math.max(1, Math.ceil(total / 25));

  const handleJobClick = (id: string) => { window.location.hash = `#/jobs/${id}`; };

  const now = new Date();
  const thisWeek = jobs.filter(j => {
    const d = new Date(j.scheduledStart);
    const weekStart = new Date(now.getTime() - now.getDay() * 86400000);
    return d >= weekStart;
  });
  const thisMonth = jobs.filter(j => {
    const d = new Date(j.scheduledStart);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Job History</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
        <Card variant="bordered">
          <span style={{ fontSize: 11, color: '#8b9bb5', textTransform: 'uppercase' }}>Total Completed</span>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#41d1c4', margin: '4px 0 0' }}>{total}</p>
        </Card>
        <Card variant="bordered">
          <span style={{ fontSize: 11, color: '#8b9bb5', textTransform: 'uppercase' }}>This Week</span>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#4ecdc4', margin: '4px 0 0' }}>{thisWeek.length}</p>
        </Card>
        <Card variant="bordered">
          <span style={{ fontSize: 11, color: '#8b9bb5', textTransform: 'uppercase' }}>This Month</span>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#f0c040', margin: '4px 0 0' }}>{thisMonth.length}</p>
        </Card>
      </div>

      <Card variant="bordered" style={{ marginBottom: 16 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search job history..." />
      </Card>

      {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={80} style={{ marginBottom: 8 }} />)}
      {!loading && error && (
        <Card variant="bordered" style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ color: '#ff6b6b' }}>{error}</p>
          <Button size="sm" onClick={refetch}>Retry</Button>
        </Card>
      )}
      {!loading && !error && jobs.length === 0 && <EmptyState title="No job history" description="No completed jobs found." />}
      {!loading && !error && jobs.map(job => (
        <Card key={job.id} variant="bordered" onClick={() => handleJobClick(job.id)} style={{ cursor: 'pointer', marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontWeight: 600, color: '#e6ecf5' }}>{job.title}</span>
              <div style={{ fontSize: 12, color: '#8b9bb5', marginTop: 2 }}>{job.customerName} &middot; {job.customerAddress}</div>
            </div>
            <StatusBadge variant="success">Completed</StatusBadge>
          </div>
          <div style={{ fontSize: 11, color: '#5a6a85', marginTop: 6 }}>
            {new Date(job.scheduledStart).toLocaleDateString()} &middot; {job.serviceType.replace('_', ' ')} &middot; {job.estimatedDuration} min
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
