import test from 'node:test';
import assert from 'node:assert/strict';
import { planConfirmedBookingToJob } from '../titan-business-services/runtime/customer-quote-flow.mjs';

const base = {
  company_id: 'company-1',
  booking_id: 'book-1',
  booking_status: 'confirmed',
  quote_ref: 'quote-1',
  customer_id: 'cust-1',
  service_id: 'svc-clean',
  property_id: 'property-1',
  correlation_id: 'corr-1',
  journey_id: 'journey-1',
  booking_context: { company_id: 'company-1', address: '1 Clean St' },
  scheduling_context: { company_id: 'company-1', appointment_id: 'appt-1', scheduled_start: '2026-09-10T09:00:00+10:00', scheduled_end: '2026-09-10T11:00:00+10:00' },
  dispatch_context: { company_id: 'company-1', dispatch_id: 'dispatch-1', worker_ids: ['worker-1'] },
};

test('confirmed booking produces governed work-order proposal using existing Jobs contracts', () => {
  const plan = planConfirmedBookingToJob(base);
  assert.equal(plan.state, 'work_order_proposal_ready');
  assert.equal(plan.next.target, 'Jobs Agent');
  assert.equal(plan.next.workflow.capability, 'crm.work_order.create');
  assert.equal(plan.next.creation_context.references.booking_id, 'book-1');
  assert.equal(plan.next.creation_context.references.appointment_id, 'appt-1');
  assert.equal(plan.next.creation_context.references.dispatch_id, 'dispatch-1');
  assert.deepEqual(plan.next.assignment.worker_ids, ['worker-1']);
  assert.equal(plan.next.assignment.assignment_performed, false);
  assert.equal(plan.next.assignment.grants_authority, false);
  assert.equal(plan.execution_authority, false);
});

test('booking-to-job continuity is idempotent across retry operation ids', () => {
  const a = planConfirmedBookingToJob({ ...base, operation_id: 'attempt-a' });
  const b = planConfirmedBookingToJob({ ...base, operation_id: 'attempt-b' });
  assert.equal(a.idempotency_key, b.idempotency_key);
  assert.equal(a.idempotency_key, 'jobs-create:company-1:book-1');
});

test('existing canonical work order suppresses duplicate materialization', () => {
  const first = planConfirmedBookingToJob(base);
  const plan = planConfirmedBookingToJob({
    ...base,
    existing_work_orders: [{ company_id: 'company-1', idempotency_key: first.idempotency_key, job_id: 'job-1' }],
  });
  assert.equal(plan.state, 'work_order_duplicate_suppressed');
  assert.equal(plan.work_order_ref, 'job-1');
  assert.equal(plan.next, null);
});

test('already-linked work order is preserved without creating a second job', () => {
  const plan = planConfirmedBookingToJob({ ...base, work_order_ref: { id: 'job-existing' } });
  assert.equal(plan.state, 'work_order_already_linked');
  assert.deepEqual(plan.work_order_ref, { id: 'job-existing' });
  assert.equal(plan.next, null);
});

test('booking-to-job refuses unconfirmed booking truth', () => {
  assert.throws(() => planConfirmedBookingToJob({ ...base, booking_status: 'pending' }), /confirmed booking/i);
});

test('booking-to-job rejects cross-company and legacy tenant contexts', () => {
  assert.throws(() => planConfirmedBookingToJob({ ...base, dispatch_context: { company_id: 'company-2' } }), /cross-company dispatch_context/i);
  assert.throws(() => planConfirmedBookingToJob({ ...base, tenant_company_id: 'legacy' }), /legacy tenant boundaries/i);
});
