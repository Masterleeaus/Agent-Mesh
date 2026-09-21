import { useKnowledgeBaseArticle } from '../hooks/useKnowledgeBase';
import { Card, Skeleton, EmptyState, ErrorState, Button } from '../../../shared/src/components';
import { CustomerService } from '../services/customer-service';
import { useNavigate } from '../routes/useNavigate';

interface KnowledgeBaseArticlePageProps {
  articleId: string;
}

export function KnowledgeBaseArticlePage({ articleId }: KnowledgeBaseArticlePageProps) {
  const { data, loading, error } = useKnowledgeBaseArticle(articleId);
  const navigate = useNavigate();

  const handleHelpful = async (helpful: boolean) => {
    await CustomerService.markArticleHelpful(articleId, helpful);
  };

  if (loading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}><Skeleton variant="rectangular" height={40} width={200} /><Skeleton variant="card" /><Skeleton variant="card" /></div>;
  if (error) return <ErrorState title="Failed to load article" message={error} onRetry={() => window.location.reload()} retryLabel="Retry" />;
  if (!data) return <EmptyState title="Article not found" description="The requested article could not be found." action={<Button variant="primary" onClick={() => navigate('/knowledge-base')}>Back to Knowledge Base</Button>} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Button variant="ghost" size="sm" onClick={() => navigate('/knowledge-base')}>&larr; Back to Knowledge Base</Button>

      <Card padding="md">
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: '0 0 8px' }}>{data.title}</h1>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          <span style={{ fontSize: 11, color: '#41d1c4', background: 'rgba(65,209,196,0.1)', padding: '2px 8px', borderRadius: 4 }}>{data.category}</span>
          {data.tags.map((tag) => (
            <span key={tag} style={{ fontSize: 11, color: '#8b9bb5', background: '#1a2744', padding: '2px 8px', borderRadius: 4 }}>{tag}</span>
          ))}
        </div>
        <div style={{ fontSize: 13, color: '#8b9bb5', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{data.content}</div>
        <div style={{ fontSize: 11, color: '#6b7b95', marginTop: 16 }}>Last updated: {new Date(data.updatedAt).toLocaleDateString()}</div>
      </Card>

      <Card padding="md">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#8b9bb5', marginBottom: 8 }}>Was this article helpful?</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => handleHelpful(true)} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #243049', background: '#131c2f', color: '#e6ecf5', cursor: 'pointer', fontSize: 13 }}>👍 Yes ({data.helpfulCount})</button>
            <button onClick={() => handleHelpful(false)} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #243049', background: '#131c2f', color: '#e6ecf5', cursor: 'pointer', fontSize: 13 }}>👎 No ({data.notHelpfulCount})</button>
          </div>
        </div>
      </Card>
    </div>
  );
}