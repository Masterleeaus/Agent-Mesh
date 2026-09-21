import { Card } from '../../../../shared/src/components';
import type { CustomerSatisfactionVM } from '../../models/view-models';

interface CustomerSatisfactionWidgetProps {
  satisfaction: CustomerSatisfactionVM | null;
  loading?: boolean;
}

export function CustomerSatisfactionWidget({ satisfaction, loading }: CustomerSatisfactionWidgetProps) {
  if (loading) {
    return (
      <Card padding="md" header={<span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Your Satisfaction</span>}>
        <div style={{ height: 80, background: '#1a2744', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
      </Card>
    );
  }

  if (!satisfaction) {
    return (
      <Card padding="md" header={<span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Your Satisfaction</span>}>
        <div style={{ color: '#6b7b95', fontSize: 12, textAlign: 'center', padding: 16 }}>No feedback data</div>
      </Card>
    );
  }

  const fullStars = Math.floor(satisfaction.averageRating);
  const hasHalf = satisfaction.averageRating - fullStars >= 0.5;

  return (
    <Card padding="md" header={<span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Your Satisfaction</span>}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#41d1c4' }}>{satisfaction.averageRating.toFixed(1)}</div>
        <div style={{ fontSize: 18 }}>
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} style={{ color: i < fullStars ? '#f0b429' : i === fullStars && hasHalf ? '#f0b429' : '#243049' }}>★</span>
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#6b7b95' }}>{satisfaction.totalReviews} reviews</div>
      </div>
    </Card>
  );
}