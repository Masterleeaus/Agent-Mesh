import { useState } from 'react';
import { Card, SearchBar, Skeleton, EmptyState } from '../../../shared/src/components';
import { useSearch } from '../hooks';
import { AppointmentStatusBadge } from '../components';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const { results, total, loading, error } = useSearch(query);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>Search</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Search appointments, customers, and technicians</p>
      </div>

      <Card variant="elevated" padding="md">
        <div style={{ marginBottom: 16 }}>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by name, ID, service type, or technician..."
            autoFocus
          />
        </div>

        {!query && (
          <EmptyState
            title="Start searching"
            description="Type in the search box above to find appointments, customers, or technicians."
          />
        )}

        {query && loading && (
          <div>
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={60} style={{ marginBottom: 8 }} />)}
          </div>
        )}

        {query && error && (
          <div style={{ padding: 16, textAlign: 'center', color: '#ef4444', fontSize: 13 }}>{error}</div>
        )}

        {query && !loading && !error && results.length === 0 && (
          <EmptyState
            title="No results found"
            description={`No results match "${query}". Try a different search term.`}
          />
        )}

        {query && !loading && results.length > 0 && (
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>{total} result{total !== 1 ? 's' : ''} for "{query}"</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {results.map(r => (
                <div
                  key={`${r.type}-${r.id}`}
                  onClick={() => {
                    if (r.type === 'appointment') window.location.hash = `#/appointments/${r.id}`;
                    if (r.type === 'technician') window.location.hash = `#/technicians/${r.id}/schedule`;
                  }}
                  style={{
                    padding: '10px 14px', borderRadius: 6, cursor: 'pointer',
                    background: '#1a2332', border: '1px solid #2a3a4e',
                    display: 'flex', alignItems: 'center', gap: 12,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#243049'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#1a2332'; }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    background: r.type === 'appointment' ? '#1e2a4a' : r.type === 'technician' ? '#1a3a2a' : '#2a2a1a',
                    color: r.type === 'appointment' ? '#60a5fa' : r.type === 'technician' ? '#4ade80' : '#f59e0b',
                    fontWeight: 700, fontSize: 14,
                  }}>
                    {r.type === 'appointment' ? 'A' : r.type === 'technician' ? 'T' : 'C'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{r.title}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{r.subtitle}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', background: '#0b1220', padding: '2px 8px', borderRadius: 4 }}>
                    {r.type}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
