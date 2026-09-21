import { useState } from 'react';
import { useFeedback } from '../hooks/useFeedback';
import { Table, Filter, StatusBadge, Pagination, Skeleton, EmptyState, ErrorState, Button, Card } from '../../../../shared/src/components';
import type { TableColumn } from '../../../../shared/src/components';
import type { FeedbackDTO } from '../models/dto';

const sentimentVariant: Record<string, 'success' | 'warning' | 'error'> = { positive: 'success', neutral: 'warning', negative: 'error' };
const categoryColors: Record<string, string> = { service: '#3b82f6', support: '#8b5cf6', product: '#16a34a', billing: '#f59e0b', general: '#6b7280' };

export default function CustomerFeedbackPage() {
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [sentimentFilter, setSentimentFilter] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const { data, total, loading, error, refetch } = useFeedback();

  const columns: TableColumn<FeedbackDTO>[] = [
    { key: 'customerName', header: 'Customer', render: (_v: unknown, row: FeedbackDTO) => <span style={{ color: '#41d1c4', fontWeight: 500 }}>{row.customerName}</span> },
    { key: 'subject', header: 'Subject' },
    { key: 'category', header: 'Category', render: (_v: unknown, row: FeedbackDTO) => <span style={{ color: categoryColors[row.category] || '#6b7280', fontWeight: 600, fontSize: 12 }}>{row.category}</span> },
    { key: 'sentiment', header: 'Sentiment', render: (_v: unknown, row: FeedbackDTO) => <StatusBadge variant={sentimentVariant[row.sentiment] || 'neutral'} size="sm">{row.sentiment}</StatusBadge> },
    { key: 'rating', header: 'Rating', render: (_v: unknown, row: FeedbackDTO) => <span style={{ fontWeight: 700, color: row.rating >= 4 ? '#16a34a' : row.rating >= 3 ? '#f59e0b' : '#ef4444' }}>{row.rating}/5</span> },
    { key: 'source', header: 'Source', render: (_v: unknown, row: FeedbackDTO) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{row.source}</span> },
    { key: 'createdAt', header: 'Date', render: (_v: unknown, row: FeedbackDTO) => <span style={{ color: '#8b9bb5', fontSize: 12 }}>{new Date(row.createdAt).toLocaleDateString()}</span> },
    { key: 'acknowledged', header: 'Status', render: (_v: unknown, row: FeedbackDTO) => row.acknowledged ? <span style={{ color: '#16a34a', fontSize: 12 }}>Reviewed</span> : <span style={{ color: '#f59e0b', fontSize: 12 }}>New</span> },
  ];

  if (loading) {
    return <div style={{ padding: 24 }}><Skeleton variant="rectangular" height={40} width={400} /><div style={{ marginTop: 16 }}><Skeleton variant="rectangular" height={300} /></div></div>;
  }

  if (error) {
    return <div style={{ padding: 24 }}><ErrorState error={error} onRetry={refetch} title="Failed to load feedback" /></div>;
  }

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Customer Feedback</h1>
        <Button variant="primary" size="sm" onClick={() => window.location.hash = '#/feedback/new'}>Record Feedback</Button>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Filter groups={[{ id: 'category', label: 'Category', type: 'checkbox', options: [
          { label: 'Service', value: 'service' }, { label: 'Support', value: 'support' },
          { label: 'Product', value: 'product' }, { label: 'Billing', value: 'billing' },
        ]}]} values={{ category: categoryFilter }}
          onChange={(id: string, value: string, checked: boolean) => { setCategoryFilter(prev => checked ? [...prev, value] : prev.filter(v => v !== value)); setPage(1); }}
          onClear={() => { setCategoryFilter([]); setPage(1); }} />
        <Filter groups={[{ id: 'sentiment', label: 'Sentiment', type: 'checkbox', options: [
          { label: 'Positive', value: 'positive' }, { label: 'Neutral', value: 'neutral' }, { label: 'Negative', value: 'negative' },
        ]}]} values={{ sentiment: sentimentFilter }}
          onChange={(id: string, value: string, checked: boolean) => { setSentimentFilter(prev => checked ? [...prev, value] : prev.filter(v => v !== value)); setPage(1); }}
          onClear={() => { setSentimentFilter([]); setPage(1); }} />
      </div>
      {data.length === 0 ? (
        <EmptyState title="No feedback" description="No customer feedback has been recorded yet." />
      ) : (
        <>
          <Table columns={columns} data={data} compact />
          {totalPages > 1 && <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}><Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} /></div>}
        </>
      )}
    </div>
  );
}
