import { useState, useEffect } from 'react';
import {
  DashboardPage,
  AppointmentQueuePage,
  CalendarViewPage,
  TimelineViewPage,
  NewAppointmentPage,
  AppointmentDetailPage,
  ReschedulePage,
  AssignTechnicianPage,
  AppointmentHistoryPage,
  CancelledAppointmentsPage,
  CompletedAppointmentsPage,
  SearchPage,
  ReportsPage,
  TechnicianSchedulePage,
  ServiceTypesPage,
  ScheduleSettingsPage,
} from '../pages';

function matchRoute(hash: string): { pattern: string; params: Record<string, string> } {
  const parts = hash.split('/').filter(Boolean);
  const patterns = [
    { pattern: '', handler: 'Dashboard' },
    { pattern: 'queue', handler: 'Queue' },
    { pattern: 'calendar', handler: 'Calendar' },
    { pattern: 'timeline', handler: 'Timeline' },
    { pattern: 'appointments/new', handler: 'NewAppointment' },
    { pattern: 'appointments/:id/reschedule', handler: 'Reschedule' },
    { pattern: 'appointments/:id/assign', handler: 'AssignTechnician' },
    { pattern: 'appointments/:id', handler: 'AppointmentDetail' },
    { pattern: 'history', handler: 'History' },
    { pattern: 'cancelled', handler: 'Cancelled' },
    { pattern: 'completed', handler: 'Completed' },
    { pattern: 'search', handler: 'Search' },
    { pattern: 'reports', handler: 'Reports' },
    { pattern: 'technicians/:id/schedule', handler: 'TechnicianSchedule' },
    { pattern: 'technicians', handler: 'TechnicianList' },
    { pattern: 'services', handler: 'ServiceTypes' },
    { pattern: 'settings', handler: 'Settings' },
  ];

  for (const p of patterns) {
    const pParts = p.pattern.split('/').filter(Boolean);
    if (pParts.length !== parts.length) continue;
    const params: Record<string, string> = {};
    let match = true;
    for (let i = 0; i < pParts.length; i++) {
      if (pParts[i].startsWith(':')) {
        params[pParts[i].slice(1)] = parts[i];
      } else if (pParts[i] !== parts[i]) {
        match = false;
        break;
      }
    }
    if (match) return { pattern: p.handler, params };
  }
  return { pattern: 'Dashboard', params: {} };
}

export function Routes() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || '/');

  useEffect(() => {
    const handler = () => setRoute(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const { pattern, params } = matchRoute(route);

  switch (pattern) {
    case 'Dashboard': return <DashboardPage />;
    case 'Queue': return <AppointmentQueuePage />;
    case 'Calendar': return <CalendarViewPage />;
    case 'Timeline': return <TimelineViewPage />;
    case 'NewAppointment': return <NewAppointmentPage />;
    case 'AppointmentDetail': return <AppointmentDetailPage id={params.id} />;
    case 'Reschedule': return <ReschedulePage id={params.id} />;
    case 'AssignTechnician': return <AssignTechnicianPage id={params.id} />;
    case 'History': return <AppointmentHistoryPage />;
    case 'Cancelled': return <CancelledAppointmentsPage />;
    case 'Completed': return <CompletedAppointmentsPage />;
    case 'Search': return <SearchPage />;
    case 'Reports': return <ReportsPage />;
    case 'TechnicianSchedule': return <TechnicianSchedulePage id={params.id} />;
    case 'TechnicianList': return <TechnicianSchedulePage />;
    case 'ServiceTypes': return <ServiceTypesPage />;
    case 'Settings': return <ScheduleSettingsPage />;
    default: return <DashboardPage />;
  }
}
