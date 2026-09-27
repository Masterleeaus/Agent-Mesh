import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRevenueJourneyCorrelation, bindRevenueJourneyEntity, assertRevenueJourneyContinuity } from '../../titan-revenue-journey/revenue-journey-correlation.mjs';
import { buildLeadOpportunityLifecycleTransition, assertLifecycleEventReplay } from '../../titan-revenue-journey/revenue-lead-opportunity-lifecycle.mjs';
import { buildQuoteLifecycleTransition, assertQuoteLifecycleReplay } from '../../titan-revenue-journey/revenue-quote-lifecycle.mjs';
import { buildBookingJobLifecycleObservation, assertBookingJobReplay } from '../../titan-revenue-journey/revenue-booking-job-lifecycle.mjs';
import { buildRevenueJourneyProjection, assertRevenueProjectionReplay } from '../../titan-revenue-journey/revenue-journey-projection.mjs';

const prov=(id='evt-1')=>({producer:'pass09-adversarial',source_event_id:id,observed_at:'2026-09-09T00:00:00Z'});
const corr=(company='co-a')=>buildRevenueJourneyCorrelation({company_id:company,correlation_id:'corr-1',lead_id:'lead-1',provenance:prov('anchor')});

test('cross-company entity binding fails closed',()=>{
  assert.throws(()=>bindRevenueJourneyEntity(corr(),{company_id:'co-b',stage:'quote',entity_id:'q-1',provenance:prov()}),/cross-company-bind/);
});

test('cross-company correlation cannot enter lead/opportunity lifecycle',()=>{
  assert.throws(()=>buildLeadOpportunityLifecycleTransition({company_id:'co-b',correlation:corr('co-a'),kind:'lead',lead_id:'lead-1',from_state:'captured',to_state:'qualifying',evidence_refs:['crm:lead-1'],provenance:prov()}),/cross-company-correlation/);
});

test('cross-company correlation cannot enter quote lifecycle',()=>{
  assert.throws(()=>buildQuoteLifecycleTransition({company_id:'co-b',correlation:corr('co-a'),quote_id:'q-1',from_state:'draft',to_state:'issued',evidence_refs:['crm:q-1'],provenance:prov()}),/cross-company-correlation/);
});

test('cross-company correlation cannot enter booking/job lifecycle',()=>{
  assert.throws(()=>buildBookingJobLifecycleObservation({company_id:'co-b',correlation:corr('co-a'),booking_id:'b-1',booking_event:'confirmed',evidence_refs:['crm:b-1'],provenance:prov()}),/cross-company-correlation/);
});

test('same source event replays deterministically across restart',()=>{
  const input={company_id:'co-a',correlation:corr(),kind:'lead',lead_id:'lead-1',from_state:'captured',to_state:'qualifying',evidence_refs:['crm:lead-1'],provenance:prov('evt-replay')};
  const a=buildLeadOpportunityLifecycleTransition(structuredClone(input));
  const b=buildLeadOpportunityLifecycleTransition(structuredClone(input));
  assert.equal(a.idempotency_key,b.idempotency_key); assert.equal(assertLifecycleEventReplay(a,b),true);
});

test('quote replay is stable and changed source event is not replay',()=>{
  const base={company_id:'co-a',correlation:corr(),quote_id:'q-1',from_state:'draft',to_state:'issued',evidence_refs:['crm:q-1']};
  const a=buildQuoteLifecycleTransition({...base,provenance:prov('quote-1')});
  const b=buildQuoteLifecycleTransition({...base,provenance:prov('quote-1')});
  const c=buildQuoteLifecycleTransition({...base,provenance:prov('quote-2')});
  assert.equal(assertQuoteLifecycleReplay(a,b),true); assert.equal(assertQuoteLifecycleReplay(a,c),false);
});

test('booking replay is stable and conflicting entity reassignment fails closed',()=>{
  const c=bindRevenueJourneyEntity(corr(),{company_id:'co-a',stage:'booking',entity_id:'b-1',provenance:prov('bind')});
  const base={company_id:'co-a',correlation:c,booking_id:'b-1',booking_event:'confirmed',evidence_refs:['crm:b-1'],provenance:prov('book-1')};
  const a=buildBookingJobLifecycleObservation(base), b=buildBookingJobLifecycleObservation(structuredClone(base));
  assert.equal(assertBookingJobReplay(a,b),true);
  assert.throws(()=>buildBookingJobLifecycleObservation({...base,booking_id:'b-2'}),/booking-id-conflict/);
});

test('out-of-order terminal lead and quote transitions are rejected',()=>{
  assert.throws(()=>buildLeadOpportunityLifecycleTransition({company_id:'co-a',correlation:corr(),kind:'lead',lead_id:'lead-1',from_state:'converted',to_state:'qualifying',evidence_refs:['crm:lead-1'],provenance:prov('late-lead')}),/transition-invalid/);
  assert.throws(()=>buildQuoteLifecycleTransition({company_id:'co-a',correlation:corr(),quote_id:'q-1',from_state:'accepted',to_state:'issued',evidence_refs:['crm:q-1'],provenance:prov('late-quote')}),/transition-invalid/);
});

test('continuity rejects mixed company or mixed journey sequences',()=>{
  const a=corr('co-a'), b=corr('co-b');
  const other=buildRevenueJourneyCorrelation({company_id:'co-a',correlation_id:'corr-other',provenance:prov('other')});
  assert.equal(assertRevenueJourneyContinuity([a,a]),true);
  assert.equal(assertRevenueJourneyContinuity([a,b]),false);
  assert.equal(assertRevenueJourneyContinuity([a,other]),false);
});

test('derived projection is restart-stable and never grants authority',()=>{
  const correlation=corr();
  const obs={kind:'lead',state:'captured',correlation,provenance:prov('obs-1')};
  const input={company_id:'co-a',surface:'owner',correlation,observations:[obs],projected_at:'2026-09-09T00:01:00Z'};
  const a=buildRevenueJourneyProjection(structuredClone(input)), b=buildRevenueJourneyProjection(structuredClone(input));
  assert.equal(assertRevenueProjectionReplay(a,b),true);
  assert.equal(a.persistence.duplicate_store_created,false);
  assert.equal(a.governance.authority_granted,false);
  assert.equal(a.governance.execution_permitted,false);
});

test('projection rejects cross-company and cross-journey observations',()=>{
  const correlation=corr();
  assert.throws(()=>buildRevenueJourneyProjection({company_id:'co-a',surface:'owner',correlation,observations:[{company_id:'co-b',kind:'lead'}]}),/cross-company-observation/);
  assert.throws(()=>buildRevenueJourneyProjection({company_id:'co-a',surface:'owner',correlation,observations:[{revenue_journey_id:'revj:other',kind:'lead'}]}),/cross-journey-observation/);
});
