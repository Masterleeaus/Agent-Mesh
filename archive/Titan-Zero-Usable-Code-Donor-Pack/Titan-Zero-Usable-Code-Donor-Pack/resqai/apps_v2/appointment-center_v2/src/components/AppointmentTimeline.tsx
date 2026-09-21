import { AppointmentStatus } from '../models/dto';

interface TimelineEvent {
  status: AppointmentStatus;
  timestamp: string;
  label: string;
}

interface AppointmentTimelineProps {
  events: TimelineEvent[];
}

const statusOrder: AppointmentStatus[] = [
  AppointmentStatus.Scheduled,
  AppointmentStatus.Confirmed,
  AppointmentStatus.InProgress,
  AppointmentStatus.Completed,
];

const lineStyle: React.CSSProperties = {
  position: 'absolute', left: 11, top: 20, bottom: 0, width: 2, background: '#2a3a4e',
};

export function AppointmentTimeline({ events }: AppointmentTimelineProps) {
  const sorted = [...events].sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));

  return (
    <div style={{ position: 'relative', paddingLeft: 32 }}>
      <div style={lineStyle} />
      {sorted.map((event, i) => {
        const isLast = i === sorted.length - 1;
        const isActive = event.status === AppointmentStatus.InProgress || event.status === AppointmentStatus.Completed;
        const isCompleted = event.status === AppointmentStatus.Completed;
        return (
          <div key={event.status} style={{ position: 'relative', paddingBottom: isLast ? 0 : 16 }}>
            <div style={{
              position: 'absolute', left: -21, top: 4, width: 12, height: 12, borderRadius: '50%',
              background: isCompleted ? '#41d1c4' : isActive ? '#f59e0b' : '#2a3a4e',
              border: isCompleted ? 'none' : `2px solid ${isActive ? '#f59e0b' : '#475569'}`,
              zIndex: 1,
            }} />
            <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: isActive ? 600 : 400 }}>
              {event.label}
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              {new Date(event.timestamp).toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
