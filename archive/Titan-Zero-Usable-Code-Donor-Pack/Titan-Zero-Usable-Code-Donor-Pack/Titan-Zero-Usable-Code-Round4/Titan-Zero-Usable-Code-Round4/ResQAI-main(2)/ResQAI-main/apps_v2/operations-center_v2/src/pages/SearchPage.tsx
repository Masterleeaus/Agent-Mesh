import { useState, type FC } from 'react';
import { Card, SearchBar, Button, Skeleton, EmptyState } from '@resqai/foundation';
import { DispatchQueueTable, PermissionGuard } from '../components';
import { useAppContext } from '../state/AppContext';
import { OPERATIONS_CENTER_PERMISSIONS } from '../contracts/permissions';
import { operationsService } from '../services/operations-service';
import type { OperationDTO } from '../models/dto';

export const SearchPage: FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OperationDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const { selectedOperationIds, toggleOperationSelection } = useAppContext();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await operationsService.search({ query: query.trim(), limit: 50 });
      setResults(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PermissionGuard permission={OPERATIONS_CENTER_PERMISSIONS.SEARCH_OPERATIONS} fallback={
      <div style={{ padding: 24, textAlign: 'center', color: '#f87171' }}>
        <h2>Permission Denied</h2>
        <p>You do not have permission to search operations.</p>
      </div>
    }>
      <div style={{ padding: 24 }}>
        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Search Operations</h1>

        <Card variant="bordered" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search by operation ID, title, customer name, address..."
                onSearch={handleSearch}
                aria-label="Search operations"
              />
            </div>
            <Button onClick={handleSearch} aria-label="Execute search">Search</Button>
          </div>
        </Card>

        {error && <div role="alert" style={{ color: '#f87171', marginBottom: 16, fontSize: 13 }}>{error}</div>}

        <Card variant="bordered" style={{ padding: 20 }}>
          {loading ? (
            <div role="status" aria-label="Searching">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={48} style={{ marginBottom: 8 }} />)}
            </div>
          ) : !searched ? (
            <div style={{ color: '#8b9bb5', textAlign: 'center', padding: 40, fontSize: 13 }}>
              Enter a search query to find operations
            </div>
          ) : results.length === 0 ? (
            <EmptyState title="No Results" message={`No operations found matching "${query}".`} />
          ) : (
            <>
              <div style={{ color: '#8b9bb5', fontSize: 13, marginBottom: 12 }}>{results.length} result{results.length !== 1 ? 's' : ''} found</div>
              <DispatchQueueTable
                operations={results}
                loading={false}
                error={null}
                onRetry={handleSearch}
                onOperationClick={(id) => { window.location.hash = `#/operations/${id}`; }}
                selectedIds={selectedOperationIds}
                onToggleSelect={toggleOperationSelection}
              />
            </>
          )}
        </Card>
      </div>
    </PermissionGuard>
  );
};
