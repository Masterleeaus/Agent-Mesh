import test from 'node:test';
import assert from 'node:assert/strict';
import {
  planAcceptedQuoteToBooking,
  planConfirmedBookingToScheduling,
} from '../titan-business-services/runtime/customer-quote-flow.mjs';

const accepted = {
  company_id: 'company-1',
  quote_id: 'quote-1',
  quote_status: 'accepted',
  customer_id: 'cust-1',
  correlation_id: 'corr-1',
  journey_id: 'journey-1',
  service_context: { company_id: 'company-1', service_id: 'svc-clean', location_id: 'loc-1' },
  booking_context: { company_id: 'company-1', requested_start: '2026-09-10T09:00:00+10:00', requested_end: '2026-09-10T11:00:00+10:00' },
  duplicate_check: { company_id: 'company-1', checked: true, source_ref: 'crm:booking-search' },
};

test('accepted quote stages canonical booking workflow with stable quote correlation', () => {
  const plan = planAcceptedQuoteToBooking(accepted);
  assert.equal(plan.state, 'booking_ready');
  assert.equal(plan.next.workflow.path, 'titan-business-services/workflows/service_booking.json');
  assert.equal(plan.next.workflow.capability, 'service.booking');
  assert.equal(plan.next.payload.quote_ref, 'quote-1');
  assert.equal(plan.next.payload.customer_id, 'cust-1');
  assert.equal(plan.next.payload.correlation_id, 'corr-1');
  assert.equal(plan.next.payload.journey_id, 'journey-1');
  assert.equal(plan.authority_neutral, true);
  assert.equal(plan.execution_authority, false);
  assert.equal(plan.restrictions.booking_creation_performed, false);
});

test('authoritative duplicate booking suppresses another booking recommendation', () => {
  const plan = planAcceptedQuoteToBooking({
    ...accepted,
    duplicate_check: { company_id: 'company-1', checked: true, source_ref: 'crm:booking-search', existing_booking_id: 'book-existing' },
  });
  assert.equal(plan.state, 'booking_duplicate_suppressed');
  assert.equal(plan.existing_booking_id, 'book-existing');
  assert.equal(plan.next, null);
});

test('booking handoff refuses non-accepted quote and missing authoritative duplicate check', () => {
  assert.throws(() => planAcceptedQuoteToBooking({ ...accepted, quote_status: 'sent' }), /accepted quote/i);
  assert.throws(() => planAcceptedQuoteToBooking({ ...accepted, duplicate_check: { company_id: 'company-1', checked: false } }), /authoritative duplicate booking check/i);
});

test('quote-to-booking company isolation rejects cross-company and legacy boundaries', () => {
  assert.throws(() => planAcceptedQuoteToBooking({ ...accepted, booking_context: { company_id: 'company-2' } }), /cross-company booking_context rejected/);
  assert.throws(() => planAcceptedQuoteToBooking({ ...accepted, tenant_company_id: 'legacy' }), /legacy tenant boundaries/);
});

test('confirmed booking produces scheduling proposal handoff only after authoritative confirmation', () => {
  const result = planConfirmedBookingToScheduling({
    company_id: 'company-1',
    booking_id: 'book-1',
    appointment_id: 'appt-1',
    booking_status: 'confirmed',
    quote_ref: 'quote-1',
    customer_id: 'cust-1',
    correlation_id: 'corr-1',
    journey_id: 'journey-1',
    scheduling_context: { company_id: 'company-1', service_id: 'svc-clean', location_id: 'loc-1' },
  });
  assert.equal(result.state, 'scheduling_proposal_ready');
  assert.equal(result.next.target, 'Scheduling Agent');
  assert.equal(result.next.booking_ref.booking_id, 'book-1');
  assert.equal(result.next.booking_ref.quote_ref, 'quote-1');
  assert.equal(result.next.grants_authority, false);
  assert.equal(result.next.assignment_performed, false);
});

test('scheduling continuation refuses unconfirmed booking truth', () => {
  assert.throws(() => planConfirmedBookingToScheduling({
    company_id: 'company-1', booking_id: 'book-1', booking_status: 'pending', quote_ref: 'quote-1', correlation_id: 'corr-1'
  }), /confirmed booking/i);
});
