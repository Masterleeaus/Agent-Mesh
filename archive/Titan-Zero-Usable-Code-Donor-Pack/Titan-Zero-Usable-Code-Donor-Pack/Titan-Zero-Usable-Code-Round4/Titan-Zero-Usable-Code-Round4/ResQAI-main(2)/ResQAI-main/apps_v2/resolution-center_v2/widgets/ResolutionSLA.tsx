import { type FC } from 'react';
import { Card, Skeleton } from '@resqai/foundation';

interface ResolutionSLAProps {
  percent?: number;
  loading?: boolean;
}

export const ResolutionSLA: FC<ResolutionSLAProps> = ({ percent, loading }) => {
  if (loading) return <Skeleton variant="rectangular" height={80} />;
  return (
    <Card variant="bordered" style={{ borderTop: '3px solid #12b76a', padding: 16 }}>
      <p style={{ margin: 0, fontSize: 12, color: '#8b9bb5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resolution SLA</p>
      <p style={{ margin: '8px 0', fontSize: 28, fontWeight: 700, color: '#e6ecf5' }}>{percent ?? 0}%</p>
    </Card>
  );
};
