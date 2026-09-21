import { useState, useCallback } from 'react';
import { useSearch } from '../hooks/useSearch';
import { Card, Input } from '../../../../shared/src/components';
import type { SearchResultVM } from '../models/view-models';

const typeColors: Record<string, string> = {
  dashboard: '#41d1c4', report: '#7c3aed', metric: '#f59e0b', chart: '#22c55e', page: '#8b9bb5',
};

export function SearchPage() {
  const { results, loading, error, search, clear } = useSearch();
  const [query, setQuery] = useState('');

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (value.trim()) { search(value); }
    else { clear(); }
  }, [search, clear]);

  const handleNavigate = (route: string) => {
    window.location.hash = route;
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e6ecf5', margin: '0 0 16px 0' }}>Search</h1>
        <Input
          placeholder="Search dashboards, reports, metrics..."
          value={query}
          onChange={handleSearch}
          style={{ maxWidth: 600 }}
          autoFocus
        />
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: 12, background: '#131c2f', borderRadius: 6, border: '1px solid #243049' }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: '#243049' }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: '60%', height: 14, background: '#243049', borderRadius: 4, marginBottom: 8 }} />
                <div style={{ width: '80%', height: 10, background: '#243049', borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', padding: 16 }}>{error}</div>
        </Card>
      )}

      {!loading && !error && query && results.length === 0 && (
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ color: '#6b7a95', fontSize: 14, textAlign: 'center', padding: 32 }}>
            No results found for &ldquo;{query}&rdquo;
          </div>
        </Card>
      )}

      {!loading && !error && results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 13, color: '#8b9bb5', marginBottom: 8 }}>{results.length} result{results.length !== 1 ? 's' : ''} found</div>
          {results.map((r) => (
            <div
              key={r.id}
              onClick={() => handleNavigate(r.route)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#131c2f', borderRadius: 6, border: '1px solid #243049', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#41d1c4'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#243049'; }}
            >
              <div style={{ width: 28, height: 28, borderRadius: 6, background: `${typeColors[r.type] || '#6b7a95'}20`, border: `1px solid ${typeColors[r.type] || '#6b7a95'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: typeColors[r.type] || '#6b7a95', textTransform: 'uppercase' }}>
                {r.type.slice(0, 3)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>{r.title}</div>
                <div style={{ fontSize: 12, color: '#8b9bb5' }}>{r.description}</div>
              </div>
              <div style={{ fontSize: 11, color: '#6b7a95' }}>
                {(r.relevance * 100).toFixed(0)}% match
              </div>
            </div>
          ))}
        </div>
      )}

      {!query && !loading && (
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ color: '#6b7a95', fontSize: 14, textAlign: 'center', padding: 32 }}>
            Type a query to search across all dashboards, reports, metrics, and charts
          </div>
        </Card>
      )}
    </div>
  );
}
