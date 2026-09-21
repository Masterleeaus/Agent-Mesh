import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLeadOpportunityLifecycleTransition, assertLifecycleEventReplay } from '../../titan-revenue-journey/revenue-lead-opportunity-lifecycle.mjs';
import { buildRevenueJourneyCorrelation } from '../../titan-revenue-journey/revenue-journey-correlation.mjs';

const provenance={producer:'sales-agent',source_event_id:'evt-1',observed_at:'2026-09-09T06:45:00+10:00'};
const base={company_id:'co-1',lead_id:'lead-1',correlation_id:'corr-1',provenance,evidence_refs:['sales:qualification:1']};

test('lead captured -> qualifying is deterministic and authority neutral',()=>{
 const a=buildLeadOpportunityLifecycleTransition({...base,kind:'lead',from_state:'captured',to_state:'qualifying'});
 const b=buildLeadOpportunityLifecycleTransition({...base,kind:'lead',from_state:'captured',to_state:'qualifying'});
 assert.equal(a.idempotency_key,b.idempotency_key); assert.equal(a.transition.disposition,'transition_proposed');
 assert.equal(a.governance.identity_is_authority,false); assert.equal(a.governance.execution_permitted,false); assert.equal(a.sales_semantics.mutation_performed,false);
});

test('Sales qualification state handoff_ready -> converted is legal but mutation-free',()=>{
 const x=buildLeadOpportunityLifecycleTransition({...base,kind:'lead',from_state:'handoff_ready',to_state:'converted'});
 assert.equal(x.transition.to_state,'converted'); assert.equal(x.sales_semantics.sales_owns_entity_truth,true); assert.equal(x.sales_semantics.lead_mutation_performed,false);
});

test('terminal converted lead cannot regress',()=>{
 assert.throws(()=>buildLeadOpportunityLifecycleTransition({...base,kind:'lead',from_state:'converted',to_state:'qualifying'}),/transition-invalid/);
});

test('same-state event is explicit idempotent replay',()=>{
 const x=buildLeadOpportunityLifecycleTransition({...base,kind:'lead',from_state:'qualified',to_state:'qualified'});
 assert.equal(x.transition.disposition,'idempotent_replay');
});

test('opportunity lifecycle supports proposed -> open -> qualified -> quote_ready',()=>{
 const corr=buildRevenueJourneyCorrelation({company_id:'co-1',lead_id:'lead-1',opportunity_id:'opp-1',correlation_id:'corr-1',provenance});
 for (const [from,to] of [['proposed','open'],['open','qualified'],['qualified','quote_ready']]) {
   const x=buildLeadOpportunityLifecycleTransition({company_id:'co-1',kind:'opportunity',opportunity_id:'opp-1',lead_id:'lead-1',from_state:from,to_state:to,correlation:corr,provenance:{...provenance,source_event_id:`${from}-${to}`},evidence_refs:['sales:opportunity']});
   assert.equal(x.revenue_journey_id,corr.revenue_journey_id); assert.equal(x.sales_semantics.opportunity_creation_performed,false);
 }
});

test('won opportunity cannot reopen',()=>assert.throws(()=>buildLeadOpportunityLifecycleTransition({company_id:'co-1',kind:'opportunity',opportunity_id:'opp-1',from_state:'won',to_state:'open',correlation_id:'corr-1',provenance,evidence_refs:['x']}),/transition-invalid/));

test('cross-company correlation fails closed',()=>{
 const corr=buildRevenueJourneyCorrelation({company_id:'co-2',lead_id:'lead-1',provenance});
 assert.throws(()=>buildLeadOpportunityLifecycleTransition({...base,kind:'lead',from_state:'captured',to_state:'qualifying',correlation:corr}),/cross-company/);
});

test('legacy company boundaries rejected',()=>assert.throws(()=>buildLeadOpportunityLifecycleTransition({...base,tenant_company_id:'legacy',kind:'lead',from_state:'captured',to_state:'qualifying'}),/legacy-company-boundary/));

test('provenance source event is mandatory',()=>assert.throws(()=>buildLeadOpportunityLifecycleTransition({...base,kind:'lead',from_state:'captured',to_state:'qualifying',provenance:{producer:'sales-agent',observed_at:'x'}}),/provenance-required/));

test('structured evidence is mandatory',()=>assert.throws(()=>buildLeadOpportunityLifecycleTransition({...base,kind:'lead',from_state:'captured',to_state:'qualifying',evidence_refs:[]}),/evidence-required/));

test('entity binding conflicts fail closed',()=>{
 const corr=buildRevenueJourneyCorrelation({company_id:'co-1',lead_id:'lead-other',provenance});
 assert.throws(()=>buildLeadOpportunityLifecycleTransition({...base,kind:'lead',from_state:'captured',to_state:'qualifying',correlation:corr}),/lead-id-conflict/);
});

test('replay assertion accepts exact deterministic replay',()=>{
 const a=buildLeadOpportunityLifecycleTransition({...base,kind:'lead',from_state:'captured',to_state:'qualifying'});
 const b=buildLeadOpportunityLifecycleTransition({...base,kind:'lead',from_state:'captured',to_state:'qualifying'});
 assert.equal(assertLifecycleEventReplay(a,b),true);
});

test('replay assertion rejects different source event',()=>{
 const a=buildLeadOpportunityLifecycleTransition({...base,kind:'lead',from_state:'captured',to_state:'qualifying'});
 const b=buildLeadOpportunityLifecycleTransition({...base,kind:'lead',from_state:'captured',to_state:'qualifying',provenance:{...provenance,source_event_id:'evt-2'}});
 assert.equal(assertLifecycleEventReplay(a,b),false);
});
