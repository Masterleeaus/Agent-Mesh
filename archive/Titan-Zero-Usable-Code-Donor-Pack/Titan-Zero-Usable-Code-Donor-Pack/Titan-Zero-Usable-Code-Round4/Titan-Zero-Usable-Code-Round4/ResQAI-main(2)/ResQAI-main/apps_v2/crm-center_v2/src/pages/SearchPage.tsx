import { useState } from 'react';
import { useSearch } from '../hooks/useSearch';
import { Input, Card, StatusBadge, Skeleton, EmptyState, Button } from '../../../../shared/src/components';
import { PermissionGuard } from '../components/PermissionGuard';
import { CRM_PERMISSIONS } from '../contracts/permissions';

const typeColors: Record<string, string> = {
  Account: '#3b82f6', Customer: '#16a34a', Followup: '#f59e0b',
  Task: '#8b5cf6', Opportunity: '#41d1c4', Interaction: '#ec4899',
};

export default function SearchPage() {
  const { query, results, loading, search, clear } = useSearch();

  return (
    <PermissionGuard permission={CRM_PERMISSIONS.SEARCH}>
      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: '0 0 20px 0' }}>Search</h1>
        <div style={{ marginBottom: 20 }}>
          <Input
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => search(e.target.value)}
            placeholder="Search accounts, customers, followups, tasks..."
            size="lg"
            clearable
            onClear={clear}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
          />
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="card" height={64} />)}
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <EmptyState title="No results" description={`No results found for "${query}". Try different keywords.`} />
        )}

        {!loading && results.length > 0 && (
          <>
            <div style={{ fontSize: 13, color: '#8b9bb5', marginBottom: 12 }}>{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {results.map((r: { type: string; id: string; label: string; sublabel?: string }, idx: number) => (
                <div key={`${r.type}-${r.id}-${idx}`} onClick={() => {
                  const routes: Record<string, string> = {
                    Account: `/accounts/${r.id}`, Customer: `/customers/${r.id}`,
                    Followup: `/followups/${r.id}`, Task: `/tasks/${r.id}`,
                    Opportunity: `/opportunities/${r.id}`, Interaction: `/interactions/${r.id}`,
                  };
                  window.location.hash = routes[r.type] || '#/search';
                }} style={{ cursor: 'pointer' }}>
                  <Card style={{ background: '#131c2f', border: '1px solid #243049' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, backgroundColor: `${typeColors[r.type]}22`, color: typeColors[r.type] || '#6b7280', textTransform: 'uppercase' }}>{r.type}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#e6ecf5' }}>{r.label}</div>
                        {r.sublabel && <div style={{ fontSize: 11, color: '#8b9bb5' }}>{r.sublabel}</div>}
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b9bb5" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </>
        )}

        {!query && !loading && (
          <div style={{ textAlign: 'center', padding: 40, color: '#8b9bb5', fontSize: 14 }}>
            Enter at least 2 characters to search across accounts, customers, followups, tasks, and opportunities.
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
