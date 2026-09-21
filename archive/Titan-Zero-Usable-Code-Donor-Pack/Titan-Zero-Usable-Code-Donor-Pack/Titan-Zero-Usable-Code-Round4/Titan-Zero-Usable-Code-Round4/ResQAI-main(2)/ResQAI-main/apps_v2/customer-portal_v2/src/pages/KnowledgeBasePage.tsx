import { useState } from 'react';
import { useKnowledgeBaseSearch } from '../hooks/useKnowledgeBase';
import { Card, SearchBar, Skeleton, EmptyState, ErrorState } from '../../../shared/src/components';

export function KnowledgeBasePage() {
  const [query, setQuery] = useState('');
  const { data, total, loading, error } = useKnowledgeBaseSearch(query);

  if (error) {
    return <ErrorState title="Search failed" message={error} onRetry={() => window.location.reload()} retryLabel="Retry" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Knowledge Base</h1>

      <div style={{ maxWidth: 500 }}>
        <SearchBar value={query} onChange={setQuery} placeholder="Search articles..." />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} variant="card" />)}
          </div>
        ) : data.length === 0 ? (
          <EmptyState title={query ? 'No results found' : 'No articles available'}
            description={query ? `No articles matching "${query}". Try a different search term.` : 'Knowledge base articles will appear here.'} />
        ) : (
          data.map((article) => (
            <Card key={article.id} padding="md" clickable onClick={() => { window.location.hash = `/knowledge-base/${article.id}`; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 4 }}>{article.title}</div>
                  <div style={{ fontSize: 12, color: '#8b9bb5', marginBottom: 8 }}>{article.summary}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#41d1c4', background: 'rgba(65,209,196,0.1)', padding: '2px 8px', borderRadius: 4 }}>{article.category}</span>
                    {article.tags.slice(0, 3).map((tag) => (
                      <span key={tag} style={{ fontSize: 11, color: '#8b9bb5', background: '#1a2744', padding: '2px 8px', borderRadius: 4 }}>{tag}</span>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#6b7b95', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <div>👍 {article.helpfulCount}</div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}