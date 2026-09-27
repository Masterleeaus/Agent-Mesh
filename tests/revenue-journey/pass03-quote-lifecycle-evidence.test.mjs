import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const root = process.cwd();
const mod = await import(pathToFileURL(path.join(root, 'packages/.tmp-revenue-journey-build/quote-lifecycle-evidence.js')).href);

const provenance={producer:'crm-quote-sync',source_event_id:'quote-evt-1',observed_at:'2026-09-13T01:50:00Z'};
const base={company_id:'co-1',quote_id:'q-1',lead_id:'lead-1',opportunity_id:'opp-1',correlation_id:'corr-1',provenance,evidence_refs:['crm:quote:q-1'],source_domain:'crm.quotes',source_ref:'quote:q-1'};

const build=(from,to,overrides={})=>mod.buildQuoteLifecycleEvidence({...base,from_journey_state:from,to_journey_state:to,...overrides});

test('draft to sent maps to canonical draft to issued without granting mutation authority',()=>{
  const x=build('draft','sent');
  assert.equal(x.canonical_transition.from_state,'draft');
  assert.equal(x.canonical_transition.to_state,'issued');
  assert.equal(x.governance.quote_truth_owner,'Titan CRM');
  assert.equal(x.governance.projection_owns_truth,false);
  assert.equal(x.governance.may_mutate_entities,false);
});

test('viewed is projection-only observation over an issued canonical quote',()=>{
  const x=build('sent','viewed');
  assert.equal(x.canonical_transition.from_state,'issued');
  assert.equal(x.canonical_transition.to_state,'issued');
  assert.equal(x.lifecycle_event.transition.disposition,'idempotent_replay');
  assert.equal(x.governance.viewed_is_observation_only,true);
});

test('accepted and declined remain terminal journey outcomes and accepted does not imply booking completion',()=>{
  const accepted=build('viewed','accepted',{provenance:{...provenance,source_event_id:'quote-evt-2'}});
  const declined=build('viewed','declined',{provenance:{...provenance,source_event_id:'quote-evt-3'}});
  assert.equal(accepted.canonical_transition.to_state,'accepted');
  assert.equal(declined.canonical_transition.to_state,'rejected');
  assert.equal(accepted.journey_transition.terminal,true);
  assert.equal(declined.journey_transition.terminal,true);
  assert.equal(accepted.governance.accepted_is_not_booking_completion,true);
});

test('expired is terminal and cannot later become accepted',()=>{
  const expired=build('sent','expired',{provenance:{...provenance,source_event_id:'quote-evt-4'}});
  assert.equal(expired.canonical_transition.to_state,'expired');
  assert.throws(()=>build('expired','accepted',{provenance:{...provenance,source_event_id:'quote-evt-5'}}),/transition-invalid/);
});

test('superseded requires explicit canonical cancelled evidence reason',()=>{
  assert.throws(()=>build('sent','superseded',{provenance:{...provenance,source_event_id:'quote-evt-6'}}),/superseded-reason-required/);
  const x=build('sent','superseded',{canonical_reason:'superseded',provenance:{...provenance,source_event_id:'quote-evt-7'}});
  assert.equal(x.canonical_transition.to_state,'cancelled');
  assert.equal(x.canonical_transition.canonical_reason,'superseded');
  assert.equal(x.governance.superseded_requires_canonical_cancelled_evidence,true);
});

test('source-domain drift and legacy company aliases fail closed',()=>{
  assert.throws(()=>build('draft','sent',{source_domain:'revenue-journey'}),/source-domain-mismatch/);
  assert.throws(()=>build('draft','sent',{tenant_company_id:'legacy'}),/legacy-company-boundary/);
});

test('replay is deterministic and changed source event is distinct',()=>{
  const a=build('sent','viewed');
  const b=build('sent','viewed');
  assert.equal(mod.assertQuoteEvidenceReplay(a,b),true);
  const c=build('sent','viewed',{provenance:{...provenance,source_event_id:'quote-evt-other'}});
  assert.equal(mod.assertQuoteEvidenceReplay(a,c),false);
});
