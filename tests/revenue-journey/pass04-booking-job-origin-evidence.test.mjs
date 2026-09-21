import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRevenueJourneyCorrelation } from '../../packages/.tmp-revenue-journey-build/revenue-journey-correlation.js';
import { buildBookingJobCommercialOriginEvidence, assertBookingJobOriginReplay } from '../../packages/.tmp-revenue-journey-build/booking-job-origin-evidence.js';

const correlation = buildRevenueJourneyCorrelation({
  company_id: 'c1',
  correlation_id: 'corr-1',
  lead_id: 'lead-1',
  opportunity_id: 'opp-1',
  quote_id: 'quote-1',
  provenance: { producer: 'test' },
});
const base = {
  company_id: 'c1',
  correlation,
  booking_id: 'booking-1',
  booking_event: 'confirmed',
  booking_source_domain: 'crm.bookings',
  booking_source_ref: 'booking:booking-1',
  provenance: { producer: 'booking-sync', source_event_id: 'evt-1', observed_at: '2026-09-13T01:00:00Z' },
  evidence: ['quote:quote-1'],
};

test('confirmed booking preserves quote as commercial origin without inventing a job', () => {
  const x = buildBookingJobCommercialOriginEvidence(base);
  assert.equal(x.commercial_origin.origin_stage, 'quote');
  assert.equal(x.commercial_origin.origin_id, 'quote-1');
  assert.equal(x.booking.booking_id, 'booking-1');
  assert.equal(x.job.job_id, null);
  assert.equal(x.lifecycle_observation.downstream, 'job_materialization_handoff_eligible');
  assert.equal(x.governance.may_mutate_entities, false);
});

test('verified job stays on the same commercial journey and field remains canonical owner', () => {
  const x = buildBookingJobCommercialOriginEvidence({
    ...base,
    job_id: 'job-1',
    job_state: 'in_progress',
    job_source_domain: 'field.work-orders',
    job_source_ref: 'job:job-1',
    job_materialization_verified: true,
    evidence: ['quote:quote-1', 'job:job-1'],
  });
  assert.equal(x.job.job_id, 'job-1');
  assert.equal(x.job.canonical_owner, 'Titan Field');
  assert.equal(x.lifecycle_observation.correlation.entities.job_id, 'job-1');
  assert.equal(x.commercial_origin.origin_id, 'quote-1');
});

test('completed job requires explicit completion evidence and never rewrites commercial origin', () => {
  assert.throws(() => buildBookingJobCommercialOriginEvidence({
    ...base,
    job_id: 'job-1', job_state: 'completed', job_source_domain: 'field.work-orders', job_source_ref: 'job:job-1', job_materialization_verified: true,
  }), /job-completion-verification-required/);
  const x = buildBookingJobCommercialOriginEvidence({
    ...base,
    job_id: 'job-1', job_state: 'completed', job_source_domain: 'field.work-orders', job_source_ref: 'job:job-1', job_materialization_verified: true, job_completion_verified: true,
  });
  assert.equal(x.commercial_origin.origin_id, 'quote-1');
  assert.equal(x.governance.job_completion_does_not_rewrite_commercial_origin, true);
});

test('wrong booking or job source domains fail closed', () => {
  assert.throws(() => buildBookingJobCommercialOriginEvidence({ ...base, booking_source_domain: 'field.work-orders' }), /booking-source-domain-mismatch/);
  assert.throws(() => buildBookingJobCommercialOriginEvidence({
    ...base, job_id: 'job-1', job_state: 'ready', job_source_domain: 'crm.bookings', job_source_ref: 'job:job-1', job_materialization_verified: true,
  }), /job-source-domain-mismatch/);
});

test('booking/job evidence requires a commercial origin and preserves company boundary', () => {
  const noOrigin = buildRevenueJourneyCorrelation({ company_id: 'c1', correlation_id: 'corr-x', provenance: { producer: 'test' } });
  assert.throws(() => buildBookingJobCommercialOriginEvidence({ ...base, correlation: noOrigin }), /commercial-origin-required/);
  assert.throws(() => buildBookingJobCommercialOriginEvidence({ ...base, company_id: 'c2' }), /cross-company-correlation/);
});

test('replay is deterministic for the same commercial-origin observation', () => {
  const a = buildBookingJobCommercialOriginEvidence(base);
  const b = buildBookingJobCommercialOriginEvidence(base);
  assert.equal(assertBookingJobOriginReplay(a, b), true);
});
