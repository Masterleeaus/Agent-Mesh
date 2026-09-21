import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRevenueJourneyCorrelation, bindRevenueJourneyEntity, assertRevenueJourneyContinuity } from '../../titan-revenue-journey/revenue-journey-correlation.mjs';
import { buildLeadOpportunityLifecycleTransition, assertLifecycleEventReplay } from '../../titan-revenue-journey/revenue-lead-opportunity-lifecycle.mjs';
import { buildQuoteLifecycleTransition, assertQuoteLifecycleReplay } from '../../titan-revenue-journey/revenue-quote-lifecycle.mjs';
import { buildBookingJobLifecycleObservation, assertBookingJobReplay } from '../../titan-revenue-journey/revenue-booking-job-lifecycle.mjs';
import { buildInvoicePaymentLifecycleObservation, assertInvoicePaymentReplay } from '../../titan-revenue-journey/revenue-invoice-payment-lifecycle.mjs';
import { buildRevenueContinuationLifecycle, assertRevenueContinuationReplay } from '../../titan-revenue-journey/revenue-continuation-lifecycle.mjs';
import { buildRevenueJourneyProjection, assertRevenueProjectionReplay } from '../../titan-revenue-journey/revenue-journey-projection.mjs';

const prov=(id)=>({producer:'pass10-cert',source_event_id:id,observed_at:'2026-09-09T00:10:00Z'});
const corr=()=>buildRevenueJourneyCorrelation({company_id:'co-cert',correlation_id:'corr-cert',provenance:prov('corr')});

test('journey correlation remains stable and entity binding is monotonic',()=>{
  const a=corr();
  const b=bindRevenueJourneyEntity(a,{company_id:'co-cert',stage:'lead',entity_id:'lead-1',provenance:prov('bind-lead')});
  const c=bindRevenueJourneyEntity(b,{company_id:'co-cert',stage:'quote',entity_id:'quote-1',provenance:prov('bind-quote')});
  assert.equal(a.revenue_journey_id,b.revenue_journey_id);
  assert.equal(b.revenue_journey_id,c.revenue_journey_id);
  assert.equal(c.entities.lead_id,'lead-1');
  assert.equal(c.entities.quote_id,'quote-1');
  assert.equal(assertRevenueJourneyContinuity([a,b,c]),true);
  assert.throws(()=>bindRevenueJourneyEntity(c,{company_id:'co-cert',stage:'lead',entity_id:'lead-2',provenance:prov('conflict')}),/lead_id-conflict/);
});

test('terminal lead and opportunity states cannot regress',()=>{
  const c=corr();
  assert.throws(()=>buildLeadOpportunityLifecycleTransition({company_id:'co-cert',correlation:c,kind:'lead',lead_id:'lead-1',from_state:'converted',to_state:'qualifying',evidence_refs:['crm:lead-1'],provenance:prov('lead-regress')}),/transition-invalid/);
  assert.throws(()=>buildLeadOpportunityLifecycleTransition({company_id:'co-cert',correlation:c,kind:'opportunity',opportunity_id:'opp-1',from_state:'won',to_state:'open',evidence_refs:['crm:opp-1'],provenance:prov('opp-regress')}),/transition-invalid/);
});

test('terminal quote outcomes are monotonic and replay-stable',()=>{
  const c=corr();
  const a=buildQuoteLifecycleTransition({company_id:'co-cert',correlation:c,quote_id:'q-1',from_state:'issued',to_state:'accepted',evidence_refs:['crm:q-1'],provenance:prov('q-accept')});
  const b=buildQuoteLifecycleTransition({company_id:'co-cert',correlation:c,quote_id:'q-1',from_state:'issued',to_state:'accepted',evidence_refs:['crm:q-1'],provenance:prov('q-accept')});
  assert.equal(a.transition.terminal,true);
  assert.equal(assertQuoteLifecycleReplay(a,b),true);
  assert.throws(()=>buildQuoteLifecycleTransition({company_id:'co-cert',correlation:c,quote_id:'q-1',from_state:'accepted',to_state:'issued',evidence_refs:['crm:q-1'],provenance:prov('q-regress')}),/transition-invalid/);
});

test('booking/job correlation remains linkage-only and replay-stable',()=>{
  const c=bindRevenueJourneyEntity(corr(),{company_id:'co-cert',stage:'booking',entity_id:'b-1',provenance:prov('bind-b')});
  const input={company_id:'co-cert',correlation:c,booking_id:'b-1',booking_event:'confirmed',evidence_refs:['crm:b-1'],provenance:prov('book')};
  const a=buildBookingJobLifecycleObservation(input), b=buildBookingJobLifecycleObservation(structuredClone(input));
  assert.equal(assertBookingJobReplay(a,b),true);
  assert.equal(a.governance.authority_granted,false);
  assert.equal(a.governance.execution_permitted,false);
  assert.equal(a.semantics.confirmed_booking_does_not_mean_job_exists,true);
});

test('invoice/payment observations never infer money-moving authority and replay deterministically',()=>{
  const c=bindRevenueJourneyEntity(corr(),{company_id:'co-cert',stage:'invoice',entity_id:'inv-1',provenance:prov('bind-inv')});
  const input={company_id:'co-cert',correlation:c,invoice_id:'inv-1',invoice_state:'partially_paid',payment_id:'pay-1',payment_state:'partial',amount_total:100,amount_paid:40,amount_refunded:0,evidence_refs:['crm:inv-1'],provenance:prov('pay')};
  const a=buildInvoicePaymentLifecycleObservation(input), b=buildInvoicePaymentLifecycleObservation(structuredClone(input));
  assert.equal(assertInvoicePaymentReplay(a,b),true);
  assert.equal(a.amounts.outstanding,60);
  assert.equal(a.semantics.partial_payment_does_not_mean_settled,true);
  assert.equal(a.governance.may_move_money,false);
  assert.equal(a.governance.may_refund,false);
});

test('continuation remains a new-link candidate, not inherited authority',()=>{
  const c=corr();
  const input={company_id:'co-cert',correlation:c,kind:'repeat_service',event_type:'customer_yes',repeat_id:'rep-1',customer_id:'cust-1',customer_explicit:true,verified_intent:true,evidence_refs:['crm:cust-1'],provenance:prov('repeat')};
  const a=buildRevenueContinuationLifecycle(input), b=buildRevenueContinuationLifecycle(structuredClone(input));
  assert.equal(assertRevenueContinuationReplay(a,b),true);
  assert.equal(a.governance.authority_granted,false);
  assert.equal(a.governance.execution_permitted,false);
  assert.equal(a.semantics.customer_yes_is_intent_not_booking_authority,true);
});

test('projections are deterministic derived views and cannot become stores or authority',()=>{
  const c=corr();
  const obs={kind:'lead',state:'captured',correlation:c,provenance:prov('obs')};
  const input={company_id:'co-cert',surface:'owner',correlation:c,observations:[obs],projected_at:'2026-09-09T00:11:00Z'};
  const a=buildRevenueJourneyProjection(input), b=buildRevenueJourneyProjection(structuredClone(input));
  assert.equal(assertRevenueProjectionReplay(a,b),true);
  assert.equal(a.persistence.is_derived,true);
  assert.equal(a.persistence.owns_store,false);
  assert.equal(a.persistence.duplicate_store_created,false);
  assert.equal(a.governance.authority_granted,false);
});

test('cross-company continuity fails closed through final certification',()=>{
  const a=corr();
  const b=buildRevenueJourneyCorrelation({company_id:'co-other',correlation_id:'corr-cert',provenance:prov('other')});
  assert.equal(assertRevenueJourneyContinuity([a,b]),false);
  assert.throws(()=>bindRevenueJourneyEntity(a,{company_id:'co-other',stage:'lead',entity_id:'lead-x',provenance:prov('cross')}),/cross-company-bind/);
});
