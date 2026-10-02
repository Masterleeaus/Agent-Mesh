import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Route } from 'next';
import { OwnerDashboard } from '../OwnerDashboard';
import { ToastProvider } from '@/components/ui/Toast';

vi.stubGlobal('React', React);
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }) }));

const props: React.ComponentProps<typeof OwnerDashboard> = {
  actionQueue: [{ label: 'Collect deposits', count: 2, href: '/app/invoices?kind=deposit' as Route, detail: 'Deposits awaiting collection', tone: 'danger' as const }],
  openPromiseRows: [{ id: 'promise-1', title: 'Call about the gate', entity_type: 'job', entity_id: 'job-1', due_at: null }],
  todayJobs: [{ id: 'job-1', title: 'Today repair', status: 'scheduled', client_name: 'Alex', property_address: '10 Main St', visit_id: 'visit-1', scheduled_start: '2026-10-01T10:00:00Z', visit_status: 'scheduled', sub_status: null }],
  materialCount: 1,
  materialJobs: [{ id: 'estimate-1', job_id: 'job-1', title: 'Gate materials', client_name: 'Alex' }],
  tomorrowJobs: [{ id: 'job-2', title: 'Tomorrow repair', status: 'scheduled', client_name: 'Sam', property_address: null, visit_id: 'visit-2', scheduled_start: '2026-10-02T10:00:00Z', visit_status: 'scheduled', sub_status: null }],
  outstandingInvoicesCents: 12000,
  pendingDepositsCents: 4500,
  paidThisMonthCents: 90000,
  openSession: { id: 'session-1', session_date: '2026-10-01', vehicle_id: 'vehicle-1', vehicle_nickname: 'Work van', vehicle_plate: null, start_odometer: 1000 },
  vehicles: [{ id: 'vehicle-1', nickname: 'Work van', plate: null, current_odometer: 1000 }],
  dayMileage: { totalMiles: 12, completedSessions: 1, openSessions: 1, perVehicle: [] },
  yesterdayMiles: 24,
  pendingSegments: 3,
  todayExpensesCents: 6500,
  monthExpensesCents: 32500,
  receiptsMissing: 4,
};

function render(input = props) {
  return renderToStaticMarkup(React.createElement(ToastProvider, null, React.createElement(OwnerDashboard, input)));
}

describe('owner dashboard data contract', () => {
  it('renders supplied action, promise, visit and material data instead of an empty attention projection', () => {
    const html = render();
    for (const text of ['Collect deposits', 'Call about the gate', 'Today repair', 'Tomorrow repair', 'Gate materials']) expect(html).toContain(text);
    expect(html).toContain('/app/jobs/job-1/materials?tab=buy');
    expect(html).not.toContain('Nothing leaking');
  });

  it('does not claim nothing is leaking while customer promises remain', () => {
    const html = render({ ...props, actionQueue: [] });
    expect(html).toContain('Call about the gate');
    expect(html).not.toContain('Nothing leaking');
  });

  it('preserves money, mileage, vehicle, expense and capture summaries', () => {
    const html = render();
    for (const text of ['$120.00', '$45.00', '$900.00', 'Work van', '12 mi', '24 mi', '$65.00', '$325.00', '3 captured locations', '4 missing receipts']) expect(html).toContain(text);
  });

  it('shows a truthful empty attention state and handles missing vehicles and visits', () => {
    const html = render({ ...props, actionQueue: [], openPromiseRows: [], todayJobs: [], tomorrowJobs: [], materialJobs: [], materialCount: 0, openSession: null, vehicles: [] });
    expect(html).toContain('Nothing leaking');
    expect(html).toContain('No visits scheduled tomorrow');
    expect(html).toContain('No open mileage session');
  });
});
