import { useState, type FC } from 'react';
import { Card, SearchBar, Filter, Pagination, Button, Skeleton, EmptyState, ErrorState, StatusBadge } from '@resqai/foundation';
import type { FilterGroup } from '@resqai/foundation';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';
import { PermissionGuard } from '../components/PermissionGuard';
import { RESOLUTION_CENTER_PERMISSIONS } from '../contracts/permissions';

const filterGroups: FilterGroup[] = [
  {
    id: 'category',
    label: 'Category',
    type: 'checkbox',
    options: [
      { label: 'Process', value: 'Process' },
      { label: 'Policy', value: 'Policy' },
      { label: 'Training', value: 'Training' },
      { label: 'Templates', value: 'Templates' },
    ],
  },
];

export const KnowledgeBasePage: FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filterParams: Record<string, unknown> = { page, pageSize: 25, search };
  Object.entries(filterValues).forEach(([key, vals]) => { if (vals.length > 0) filterParams[key] = vals; });

  const { articles, total, loading, error, refetch } = useKnowledgeBase(filterParams as Parameters<typeof useKnowledgeBase>[0]);
  const totalPages = Math.max(1, Math.ceil(total / 25));

  const handleFilterChange = (groupId: string, value: string, checked: boolean) => {
    setFilterValues(prev => {
      const current = prev[groupId] || [];
      return { ...prev, [groupId]: checked ? [...current, value] : current.filter(v => v !== value) };
    });
    setPage(1);
  };

  return (
    <PermissionGuard permission={RESOLUTION_CENTER_PERMISSIONS.VIEW_KNOWLEDGE_BASE}>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Knowledge Base</h1>
          <PermissionGuard permission={RESOLUTION_CENTER_PERMISSIONS.MANAGE_KNOWLEDGE_BASE}>
            <Button size="sm" variant="primary">+ New Article</Button>
          </PermissionGuard>
        </div>
        <Card variant="bordered" style={{ marginBottom: 16 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search knowledge base..." aria-label="Search knowledge base" />
        </Card>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ width: 220, flexShrink: 0 }}>
            <Card variant="bordered" role="region" aria-label="Filters">
              <Filter groups={filterGroups} values={filterValues} onChange={handleFilterChange} onClear={() => setFilterValues({})} />
            </Card>
          </div>
          <div style={{ flex: 1 }}>
            {loading && (
              <div role="status" aria-label="Loading">
                <Skeleton variant="rectangular" height={40} style={{ marginBottom: 8 }} />
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={80} style={{ marginBottom: 8 }} />)}
              </div>
            )}
            {error && <ErrorState title="Failed to load articles" message={error} onRetry={refetch} />}
            {!loading && !error && articles.length === 0 && <EmptyState title="No articles found" description="No knowledge base articles match your criteria." />}
            {!loading && !error && articles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {articles.map(article => (
                  <Card key={article.id} variant="bordered" style={{ padding: 12 }}>
                    <div style={{ cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === article.id ? null : article.id)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, color: '#e6ecf5', fontSize: 14 }}>{article.title}</p>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                            <StatusBadge variant="info" style={{ fontSize: 10 }}>{article.category}</StatusBadge>
                            <span style={{ fontSize: 11, color: '#6b7b95' }}>Updated {new Date(article.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span style={{ color: '#8b9bb5', fontSize: 12 }}>{expandedId === article.id ? '▲' : '▼'}</span>
                      </div>
                      {expandedId === article.id && (
                        <div style={{ marginTop: 12, borderTop: '1px solid #1a2744', paddingTop: 12 }}>
                          <p style={{ margin: 0, fontSize: 13, color: '#c0c8d8', lineHeight: 1.6 }}>{article.content}</p>
                          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                            {article.tags.map(tag => (
                              <span key={tag} style={{ fontSize: 11, background: '#1a2744', color: '#8b9bb5', padding: '2px 8px', borderRadius: 4 }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                          <p style={{ margin: '8px 0 0', fontSize: 11, color: '#6b7b95' }}>By {article.authorName}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
            {totalPages > 1 && (
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};
