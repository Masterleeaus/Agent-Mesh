import { useState } from 'react';
import type { AppointmentCardVM, ScheduleDayVM } from '../models/view-models';
import { AppointmentCard } from './AppointmentCard';

interface ScheduleCalendarProps {
  days: ScheduleDayVM[];
  loading?: boolean;
  viewMode?: 'day' | 'week' | 'month';
  onAppointmentClick?: (id: string) => void;
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: 16 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' },
  navBtn: { background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13 },
  grid: { display: 'grid', gap: 8 },
  weekGrid: { gridTemplateColumns: 'repeat(7, 1fr)' },
  dayGrid: { gridTemplateColumns: '1fr' },
  dayCell: { background: '#1a2332', border: '1px solid #2a3a4e', borderRadius: 8, padding: 8, minHeight: 120 },
  dayLabel: { fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' as const },
  dayNum: { fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginLeft: 4 },
  skeleton: { background: '#1a2332', border: '1px solid #2a3a4e', borderRadius: 8, padding: 12, height: 120, animation: 'pulse 1.5s ease-in-out infinite' },
  emptyDay: { display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 12, minHeight: 120 },
};

const SkeletonDay = () => <div style={styles.skeleton} />;

export function ScheduleCalendar({ days, loading, viewMode = 'week', onAppointmentClick }: ScheduleCalendarProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.grid, ...styles.weekGrid }}>
          {Array.from({ length: 7 }).map((_, i) => <SkeletonDay key={i} />)}
        </div>
      </div>
    );
  }

  if (!days.length) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.navBtn} onClick={() => setWeekOffset(o => o - 1)}>← Prev</button>
        <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Week {weekOffset + 1}</span>
        <button style={styles.navBtn} onClick={() => setWeekOffset(o => o + 1)}>Next →</button>
      </div>
      <div style={{ ...styles.grid, ...(viewMode === 'day' ? styles.dayGrid : styles.weekGrid) }}>
        {days.map(day => (
          <div key={day.date} style={styles.dayCell}>
            <div style={styles.dayLabel}>
              {day.dayLabel} <span style={styles.dayNum}>{day.date.split('-')[2]}</span>
            </div>
            {day.appointments.length === 0 ? (
              <div style={styles.emptyDay}>No appointments</div>
            ) : (
              day.appointments.map(apt => (
                <AppointmentCard key={apt.id} appointment={apt} onClick={() => onAppointmentClick?.(apt.id)} />
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
