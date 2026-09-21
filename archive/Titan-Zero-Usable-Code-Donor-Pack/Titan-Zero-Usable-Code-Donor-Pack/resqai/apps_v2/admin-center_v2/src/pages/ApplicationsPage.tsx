import { useApplications } from '../hooks/useApplications';
import { Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import { ApplicationCard } from '../components/ApplicationCard';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 };

export function ApplicationsPage() {
  const { data, loading, error, refetch } = useApplications();

  const navigateToApp = (id: string) => { window.location.hash = `#/applications/${id}`; };

  if (error) return <ErrorState title="Failed to load applications" message={error} onRetry={refetch} />;

  return (
    <div style={pageStyle}>
      <div style={titleStyle}>Applications</div>
      {loading && data.length === 0 ? (
        <div style={gridStyle}>{[1,2,3,4].map(i => <Skeleton key={i} variant="card" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState title="No applications" description="No applications have been registered." />
      ) : (
        <div style={gridStyle}>{data.map(a => <ApplicationCard key={a.id} app={a} onClick={navigateToApp} />)}</div>
      )}
    </div>
  );
}
