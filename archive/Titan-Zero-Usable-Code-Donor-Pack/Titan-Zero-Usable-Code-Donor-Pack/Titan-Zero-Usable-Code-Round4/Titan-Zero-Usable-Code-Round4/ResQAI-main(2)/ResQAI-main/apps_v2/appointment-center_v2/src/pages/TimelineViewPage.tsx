import { useState, useMemo } from 'react';
import { Card, Button, Input, SearchBar } from '../../../shared/src/components';
import { TimelineView } from '../components';
import { useAppointments } from '../hooks';

export function TimelineViewPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const { appointments, loading, error, refetch } = useAppointments({ date, pageSize: 50 });

  const filtered = useMemo(() => {
    if (!search) return appointments;
    const q = search.toLowerCase();
    return appointments.filter(a =>
      a.customerName.toLowerCase().includes(q) ||
      a.serviceTypeName.toLowerCase().includes(q) ||
      a.technicianName.toLowerCase().includes(q)
    );
  }, [appointments, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>Timeline View</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Hourly timeline of appointments</p>
      </div>

      <Card variant="elevated" padding="md">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} label="Date" />
          <div style={{ flex: 1 }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Filter appointments..." />
          </div>
          <Button variant="ghost" onClick={() => window.location.hash = '#/calendar'}>Calendar View</Button>
        </div>
        <TimelineView
          appointments={filtered}
          loading={loading}
          onAppointmentClick={id => window.location.hash = `#/appointments/${id}`}
        />
      </Card>
    </div>
  );
}
