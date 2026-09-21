import { useState } from 'react';
import { Card, Button } from '../../../shared/src/components';

interface CalendarEvent {
  date: number;
  label: string;
}

interface AppointmentCalendarProps {
  year: number;
  month: number;
  events: CalendarEvent[];
  onDateSelect?: (date: number) => void;
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AppointmentCalendar({ year, month, events, onDateSelect }: AppointmentCalendarProps) {
  const [viewMonth, setViewMonth] = useState(month);
  const [viewYear, setViewYear] = useState(year);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const today = new Date();

  const eventDates = new Set(events.map((e) => e.date));

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <Card padding="md">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Button variant="ghost" size="sm" onClick={prevMonth}>&larr;</Button>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>{monthLabel}</span>
        <Button variant="ghost" size="sm" onClick={nextMonth}>&rarr;</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
        {dayNames.map((d) => <div key={d} style={{ fontSize: 11, color: '#6b7b95', padding: 4 }}>{d}</div>)}
        {days.map((d, i) => {
          if (d === null) return <div key={`e-${i}`} />;
          const isToday = d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
          const hasEvent = eventDates.has(d);
          return (
            <div
              key={d}
              onClick={() => onDateSelect?.(d)}
              style={{
                padding: 8, borderRadius: 6, cursor: 'pointer', fontSize: 13,
                background: isToday ? '#41d1c4' : hasEvent ? 'rgba(65,209,196,0.15)' : 'transparent',
                color: isToday ? '#0b1220' : hasEvent ? '#41d1c4' : '#e6ecf5',
                fontWeight: hasEvent || isToday ? 700 : 400,
              }}
            >
              {d}
              {hasEvent && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#41d1c4', margin: '2px auto 0' }} />}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
