import { useState } from 'react';
import { useDownloads } from '../hooks/useDownloads';
import { Card, Skeleton, EmptyState, ErrorState, Button } from '../../../shared/src/components';

export function DownloadsPage() {
  const [page, setPage] = useState(1);
  const { data, total, loading, error } = useDownloads(page);

  if (error) {
    return <ErrorState title="Failed to load downloads" message={error} onRetry={() => window.location.reload()} retryLabel="Retry" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Downloads</h1>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="card" />)}
        </div>
      ) : data.length === 0 ? (
        <EmptyState title="No downloads available" description="There are no files available to download at this time." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.map((dl) => (
            <Card key={dl.id} padding="md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>📄</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>{dl.name}</div>
                    <div style={{ fontSize: 12, color: '#8b9bb5' }}>{dl.description}</div>
                    <div style={{ fontSize: 11, color: '#6b7b95', marginTop: 2 }}>{dl.category} · {dl.fileSize}</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => alert(`Downloading ${dl.name}...`)}>Download</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}