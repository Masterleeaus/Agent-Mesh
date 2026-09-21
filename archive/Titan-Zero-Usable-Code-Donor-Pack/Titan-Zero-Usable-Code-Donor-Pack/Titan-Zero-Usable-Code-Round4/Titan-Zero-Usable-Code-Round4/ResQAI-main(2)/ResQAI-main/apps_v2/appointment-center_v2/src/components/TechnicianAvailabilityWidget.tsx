import { Card, StatusBadge, Skeleton } from '../../../shared/src/components';
import type { TechnicianDTO } from '../models/dto';

interface TechnicianAvailabilityWidgetProps {
  technicians: TechnicianDTO[];
  loading?: boolean;
  onTechnicianClick?: (id: string) => void;
}

export function TechnicianAvailabilityWidget({ technicians, loading, onTechnicianClick }: TechnicianAvailabilityWidgetProps) {
  if (loading) {
    return (
      <Card variant="bordered" padding="md">
        <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>Technician Availability</div>
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="text" height={36} style={{ marginBottom: 8 }} />)}
      </Card>
    );
  }

  return (
    <Card variant="bordered" padding="md">
      <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>Technician Availability</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {technicians.map(t => (
          <div
            key={t.id}
            onClick={() => onTechnicianClick?.(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
              borderRadius: 6, cursor: 'pointer', background: '#1a2332', border: '1px solid #2a3a4e',
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: t.isOnline ? '#1a3a2a' : '#2a2a2a',
              color: t.isOnline ? '#4ade80' : '#64748b', fontWeight: 700, fontSize: 13,
            }}>
              {t.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{t.name}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{t.activeAppointments} active · Next: {t.nextAvailable}</div>
            </div>
            <StatusBadge variant={t.isOnline ? 'success' : 'neutral'} size="sm">
              {t.isOnline ? 'Online' : 'Offline'}
            </StatusBadge>
          </div>
        ))}
      </div>
    </Card>
  );
}
