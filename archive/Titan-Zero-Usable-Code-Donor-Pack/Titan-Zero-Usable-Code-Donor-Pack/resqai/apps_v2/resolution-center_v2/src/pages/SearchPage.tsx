import { useState, type FC } from 'react';
import { Card, Button, SearchBar, Skeleton, EmptyState, StatusBadge } from '@resqai/foundation';
import { useSearch } from '../hooks/useSearch';
import { PermissionGuard } from '../components/PermissionGuard';
import { RESOLUTION_CENTER_PERMISSIONS } from '../contracts/permissions';

export const SearchPage: FC = () => {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const { results, loading, error, search } = useSearch();

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearched(true);
    search({ query, pageSize: 50 });
  };

  return (
    <PermissionGuard permission={RESOLUTION_CENTER_PERMISSIONS.VIEW_SEARCH}>
      <div style={{ padding: 24 }}>
        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Search</h1>
        <div style={{ marginBottom: 16 }}>
          <SearchBar
            value={query}
            onChange={setQuery}
            onSearch={handleSearch}
            placeholder="Search cases, disputes, knowledge base..."
            aria-label="Global search"
          />
        </div>

        {!searched && !loading && (
          <EmptyState title="Enter a search query" description="Search across cases, disputes, and knowledge base articles." />
        )}

        {loading && (
          <div role="status" aria-label="Searching">
            <Skeleton variant="rectangular" height={40} style={{ marginBottom: 8 }} />
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={48} style={{ marginBottom: 8 }} />)}
          </div>
        )}

        {searched && !loading && results.total === 0 && (
          <EmptyState title="No results found" description={`No results matching "${query}".`} />
        )}

        {searched && !loading && results.total > 0 && (
          <div>
            <p style={{ fontSize: 13, color: '#8b9bb5', marginBottom: 16 }}>{results.total} results found for "{query}"</p>

            {results.cases.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 14, color: '#41d1c4' }}>Cases ({results.cases.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {results.cases.map(c => (
                    <Card key={c.id} variant="bordered" style={{ padding: 10, cursor: 'pointer' }} onClick={() => { window.location.hash = `#/disputes/${c.id}`; }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#e6ecf5' }}>{c.summary}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#8b9bb5' }}>{c.customerName}</p>
                        </div>
                        <StatusBadge variant={c.priority === 'critical' ? 'error' : c.priority === 'high' ? 'warning' : 'info'} style={{ fontSize: 10 }}>
                          {c.priority}
                        </StatusBadge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {results.disputes.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 14, color: '#f79009' }}>Disputes ({results.disputes.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {results.disputes.map((d, i) => (
                    <Card key={`disp-${i}`} variant="bordered" style={{ padding: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#e6ecf5' }}>{d.summary}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#8b9bb5' }}>{d.customerName}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {results.knowledge.length > 0 && (
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: 14, color: '#12b76a' }}>Knowledge Base ({results.knowledge.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {results.knowledge.map((k, i) => (
                    <Card key={`kb-${i}`} variant="bordered" style={{ padding: 10 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#e6ecf5' }}>{k.summary}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};
