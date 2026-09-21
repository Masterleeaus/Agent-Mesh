import { type FC } from 'react';
import { Card, Skeleton } from '@resqai/foundation';
import type { RegionalStatusVM } from '../models/view-models';

interface RegionalStatusWidgetProps {
  regions: RegionalStatusVM[];
  loading: boolean;
}

export const RegionalStatusWidget: FC<RegionalStatusWidgetProps> = ({ regions, loading }) => {
  if (loading) {
    return (
      <Card variant="bordered" style={{ padding: 20 }}>
        <Skeleton variant="text" height={16} width="60%" style={{ marginBottom: 12 }} />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="text" height={20} style={{ marginBottom: 8 }} />)}
      </Card>
    );
  }
  return (
    <Card variant="bordered" style={{ padding: 20 }} role="region" aria-label="Regional status">
      <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Regional Status</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {regions.map((r) => (
          <div key={r.region} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
              <span style={{ fontSize: 13, color: '#e6ecf5' }}>{r.regionName}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#8b9bb5' }}>
              <span>{r.activeOperations} active</span>
              <span>{r.availableTechnicians} techs</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
