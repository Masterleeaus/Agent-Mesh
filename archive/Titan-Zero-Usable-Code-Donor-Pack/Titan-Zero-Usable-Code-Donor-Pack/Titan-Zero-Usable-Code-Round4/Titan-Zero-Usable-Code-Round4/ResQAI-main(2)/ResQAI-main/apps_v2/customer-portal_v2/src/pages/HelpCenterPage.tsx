import { useState } from 'react';
import { useHelpCenter } from '../hooks/useHelpCenter';
import { Card, SearchBar, Skeleton, EmptyState, ErrorState } from '../../../shared/src/components';

export function HelpCenterPage() {
  const { faqs, loading, error } = useHelpCenter();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (error) {
    return <ErrorState title="Failed to load help center" message={error} onRetry={() => window.location.reload()} retryLabel="Retry" />;
  }

  const filtered = faqs.filter((faq) =>
    !search || faq.question.toLowerCase().includes(search.toLowerCase()) || faq.answer.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(filtered.map((f) => f.category))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Help Center</h1>

      <div style={{ maxWidth: 500 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search FAQs..." />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No results" description={search ? `No FAQs matching "${search}".` : 'No FAQ content available.'} />
      ) : (
        categories.map((category) => (
          <Card key={category} padding="md" header={<span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>{category}</span>}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filtered.filter((f) => f.category === category).map((faq, idx) => {
                const id = `${category}-${idx}`;
                const isExpanded = expandedId === id;
                return (
                  <div key={id}>
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', cursor: 'pointer', borderBottom: '1px solid #1a2744' }}
                      onClick={() => setExpandedId(isExpanded ? null : id)}>
                      <span style={{ fontSize: 13, color: '#e6ecf5' }}>{faq.question}</span>
                      <span style={{ color: '#8b9bb5', fontSize: 14 }}>{isExpanded ? '−' : '+'}</span>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: '12px 0 12px 16px', fontSize: 13, color: '#8b9bb5', lineHeight: 1.6, borderBottom: '1px solid #1a2744' }}>
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))
      )}

      <Card padding="md" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: '#8b9bb5', marginBottom: 8 }}>Still need help?</div>
        <button onClick={() => { window.location.hash = '/tickets/new'; }}
          style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#41d1c4', color: '#0b1220', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          Contact Support
        </button>
      </Card>
    </div>
  );
}