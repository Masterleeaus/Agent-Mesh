import { Card, StatusBadge } from '../../../../shared/src/components';
import type { TechnicianTrackingVM } from '../../models/view-models';

interface TechnicianETAWidgetProps {
  tracking: TechnicianTrackingVM | null;
  loading?: boolean;
  onViewDetails?: () => void;
}

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  en_route: 'info',
  on_site: 'warning',
  in_progress: 'warning',
  completed: 'success',
};

export function TechnicianETAWidget({ tracking, loading, onViewDetails }: TechnicianETAWidgetProps) {
  if (loading) {
    return (
      <Card padding="md" header={<span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Technician ETA</span>}>
        <div style={{ height: 80, background: '#1a2744', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
      </Card>
    );
  }

  if (!tracking) {
    return (
      <Card padding="md" header={<span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Technician ETA</span>}>
        <div style={{ color: '#6b7b95', fontSize: 12, textAlign: 'center', padding: 16 }}>No active appointment for tracking</div>
      </Card>
    );
  }

  return (
    <Card padding="md" header={<span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Technician ETA</span>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e6ecf5' }}>{tracking.technicianName}</div>
            <div style={{ fontSize: 11, color: '#6b7b95' }}>{tracking.serviceType}</div>
          </div>
          <StatusBadge variant={statusVariant[tracking.status] ?? 'info'}>{tracking.status.replace(/_/g, ' ')}</StatusBadge>
        </div>
        {tracking.etaMinutes !== null && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: '#41d1c4' }}>{tracking.etaMinutes}</span>
            <span style={{ fontSize: 13, color: '#8b9bb5' }}>minutes away</span>
          </div>
        )}
        {tracking.currentLocation && (
          <div style={{ fontSize: 11, color: '#6b7b95' }}>Last known location: {tracking.currentLocation}</div>
        )}
      </div>
      {onViewDetails && (
        <div style={{ marginTop: 8, textAlign: 'center' }}>
          <button onClick={onViewDetails} style={{ background: 'none', border: 'none', color: '#41d1c4', fontSize: 12, cursor: 'pointer' }}>Track Live</button>
        </div>
      )}
    </Card>
  );
}