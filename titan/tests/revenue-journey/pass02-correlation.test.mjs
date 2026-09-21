import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRevenueJourneyCorrelation,
  bindRevenueJourneyEntity,
  assertRevenueJourneyContinuity,
  REVENUE_JOURNEY_CORRELATION_SCHEMA
} from '../../titan-revenue-journey/revenue-journey-correlation.mjs';

const base = { company_id: 'co-a', provenance: { producer: 'sales-agent', source_event_id: 'evt-1' } };

test('builds deterministic company-scoped revenue journey from correlation id', () => {
  const a = buildRevenueJourneyCorrelation({ ...base, correlation_id: 'corr-1', lead_id: 'lead-1' });
  const b = buildRevenueJourneyCorrelation({ ...base, correlation_id: 'corr-1', lead_id: 'lead-1' });
  assert.equal(a.schema, REVENUE_JOURNEY_CORRELATION_SCHEMA);
  assert.equal(a.revenue_journey_id, b.revenue_journey_id);
  assert.equal(a.company_id, 'co-a');
});

test('same correlation id in another company cannot collide', () => {
  const a = buildRevenueJourneyCorrelation({ ...base, correlation_id: 'corr-1', lead_id: 'lead-1' });
  const b = buildRevenueJourneyCorrelation({ ...base, company_id: 'co-b', correlation_id: 'corr-1', lead_id: 'lead-1' });
  assert.notEqual(a.revenue_journey_id, b.revenue_journey_id);
});

test('explicit revenue_journey_id is preserved', () => {
  const result = buildRevenueJourneyCorrelation({ ...base, revenue_journey_id: 'revj:external:1', quote_id: 'q-1' });
  assert.equal(result.revenue_journey_id, 'revj:external:1');
  assert.equal(result.revenue_journey_id_source, 'explicit_revenue_journey_id');
});

test('generic journey_id is rejected without explicit compatibility semantics', () => {
  assert.throws(() => buildRevenueJourneyCorrelation({ ...base, journey_id: 'ui-journey-1', lead_id: 'lead-1' }), /requires-explicit-compatibility/);
});

test('compatible generic journey_id is deterministically namespaced', () => {
  const result = buildRevenueJourneyCorrelation({ ...base, journey_id: 'sales-journey-1', journey_id_semantics: 'revenue_lifecycle_compatible', lead_id: 'lead-1' });
  assert.match(result.revenue_journey_id, /^revj:co-a:/);
  assert.equal(result.revenue_journey_id_source, 'compatible_generic_journey_id');
});

test('legacy company boundaries are rejected', () => {
  for (const key of ['tenant_id','tenantId','tenant_company_id','business_id','account_id']) {
    assert.throws(() => buildRevenueJourneyCorrelation({ ...base, [key]: 'legacy', lead_id: 'lead-1' }), /legacy-company-boundary-forbidden/);
  }
});

test('cross-company entity metadata is rejected', () => {
  assert.throws(() => buildRevenueJourneyCorrelation({ ...base, lead_id: 'lead-1', lead_company_id: 'co-b' }), /cross-company-entity:lead/);
});

test('requires a durable correlation anchor', () => {
  assert.throws(() => buildRevenueJourneyCorrelation(base), /correlation-anchor-required/);
});

test('entity binding preserves journey id and adds only correlation metadata', () => {
  const first = buildRevenueJourneyCorrelation({ ...base, lead_id: 'lead-1' });
  const second = bindRevenueJourneyEntity(first, { company_id: 'co-a', stage: 'opportunity', entity_id: 'opp-1', provenance: { producer: 'sales-agent' } });
  assert.equal(second.revenue_journey_id, first.revenue_journey_id);
  assert.equal(second.entities.lead_id, 'lead-1');
  assert.equal(second.entities.opportunity_id, 'opp-1');
  assert.equal(second.governance.owns_domain_truth, false);
});

test('cross-company binding fails closed', () => {
  const first = buildRevenueJourneyCorrelation({ ...base, lead_id: 'lead-1' });
  assert.throws(() => bindRevenueJourneyEntity(first, { company_id: 'co-b', stage: 'quote', entity_id: 'q-1', provenance: { producer: 'quote' } }), /cross-company-bind/);
});

test('conflicting stage entity id fails closed', () => {
  const first = buildRevenueJourneyCorrelation({ ...base, lead_id: 'lead-1' });
  assert.throws(() => bindRevenueJourneyEntity(first, { company_id: 'co-a', stage: 'lead', entity_id: 'lead-2', provenance: { producer: 'sales-agent' } }), /lead_id-conflict/);
});

test('continuity requires one company and one revenue_journey_id', () => {
  const first = buildRevenueJourneyCorrelation({ ...base, lead_id: 'lead-1' });
  const second = bindRevenueJourneyEntity(first, { company_id: 'co-a', stage: 'quote', entity_id: 'q-1', provenance: { producer: 'quote' } });
  assert.equal(assertRevenueJourneyContinuity([first, second]), true);
  assert.equal(assertRevenueJourneyContinuity([first, { ...second, company_id: 'co-b' }]), false);
  assert.equal(assertRevenueJourneyContinuity([first, { ...second, revenue_journey_id: 'other' }]), false);
});

test('correlation metadata never grants authority or execution', () => {
  const result = buildRevenueJourneyCorrelation({ ...base, booking_id: 'book-1' });
  assert.deepEqual(result.governance, {
    company_boundary: 'company_id',
    owns_domain_truth: false,
    identity_is_authority: false,
    authority_granted: false,
    execution_permitted: false,
    may_create_entities: false,
    may_mutate_entities: false,
    generic_journey_id_is_not_implicitly_revenue_journey_id: true
  });
});
