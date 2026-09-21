import { type FC } from 'react';
import { Card, Skeleton } from '@resqai/foundation';

interface HighPriorityCasesProps {
  count?: number;
  loading?: boolean;
}

export const HighPriorityCases: FC<HighPriorityCasesProps> = ({ count, loading }) => {
  if (loading) return <Skeleton variant="rectangular" height={80} />;
  return (
    <Card variant="bordered" style={{ borderTop: '3px solid #f04438', padding: 16 }}>
      <p style={{ margin: 0, fontSize: 12, color: '#8b9bb5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>High Priority</p>
      <p style={{ margin: '8px 0', fontSize: 28, fontWeight: 700, color: '#e6ecf5' }}>{count ?? 0}</p>
    </Card>
  );
};
