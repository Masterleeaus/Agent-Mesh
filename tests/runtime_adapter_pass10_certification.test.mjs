import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { WorkRuntimeAdapter } from '../titan-runtime/adapters/work-runtime-adapter.mjs';
import { negotiateRuntimeAdapter, selectAdapterPath } from '../titan-runtime/adapters/adapter-negotiation.mjs';
import { createTypedLifecycle } from '../titan-runtime/adapters/typed-work-lifecycle.mjs';
import { prepareLegacyDomFallback } from '../titan-runtime/adapters/legacy-dom-discovery.mjs';
import { createAdapterSession, recoverAdapterSession } from '../titan-runtime/adapters/adapter-session-recovery.mjs';

const root=path.resolve(import.meta.dirname,'..');
for(const rel of [
  'titan-runtime/adapters/pass10/RUNTIME-ADAPTER-PROTOCOL-v1.md',
  'titan-runtime/adapters/pass10/MIGRATION-GUIDE.md',
  'titan-runtime/adapters/pass10/MANAGER-HANDOFF.json'
]) assert.equal(fs.existsSync(path.join(root,rel)),true,rel);

const handoff=JSON.parse(fs.readFileSync(path.join(root,'titan-runtime/adapters/pass10/MANAGER-HANDOFF.json'),'utf8'));
assert.equal(handoff.status,'READY_FOR_MANAGER_MERGE');
assert.equal(handoff.boundaries.company_boundary,'company_id');
assert.equal(handoff.boundaries.adapter_grants_authority,false);
assert.equal(handoff.slimming_gate.retriever_background_retirement_authorized_by_builder,false);

const gate={company_id:'company-final',execution_allowed:true,decision_id:'decision-final',authority_source:'Titan Governance',policy_version:'policy-final'};
const negotiation=negotiateRuntimeAdapter({
  local_runtime:'Titan',remote_runtime:'Retriever',local_version:'1.0',remote_version:'1.0',
  local_capabilities:['work_submission','progress_observation','result_delivery','cancellation'],
  remote_capabilities:['work_submission','progress_observation','result_delivery','cancellation'],
  required_capabilities:['work_submission','result_delivery'],legacy_fallback_available:true
});
assert.equal(negotiation.status,'ready');
assert.equal(selectAdapterPath({negotiation}).path,'typed');

const adapter=new WorkRuntimeAdapter({runtime:'Retriever',capabilities:negotiation.selected_capabilities});
const prepared=adapter.prepareSubmission({
 company_id:'company-final',work_id:'work-final',correlation_id:'corr-final',operation_id:'op-final',idempotency_key:'idem-final',
 execution_gate:gate,payload:{goal:'certify'}
});
const life=createTypedLifecycle(prepared,{started_at:1000,timeout_ms:5000});
life.accept({});
life.updateProgress({progress:0.5});
const completed=life.complete({ok:true});
assert.equal(completed.snapshot.state,'complete');
assert.equal(completed.snapshot.execution_authority,false);

const session=createAdapterSession({
 session_id:'session-final',company_id:'company-final',runtime:'Retriever',adapter_version:'1.0',
 correlation_id:'corr-final',work_id:'work-final',navigation_key:'page-a',created_at:1000,last_seen_at:1000
});
const recovery=recoverAdapterSession(session,{
 company_id:'company-final',navigation_key:'page-b',runtime:'Retriever',adapter_version:'1.0',now:1500,stale_after_ms:5000
});
assert.equal(recovery.requires_fresh_authority_evaluation,true);
assert.equal(recovery.session.authority_snapshot_ref,null);

const incompatible=negotiateRuntimeAdapter({
 local_runtime:'Titan',remote_runtime:'Retriever',local_version:'1.0',remote_version:'2.0',
 remote_capabilities:['work_submission'],legacy_fallback_available:true
});
const fallback=prepareLegacyDomFallback({
 negotiation:incompatible,company_id:'company-final',work_id:'legacy-final',correlation_id:'lcorr',
 operation_id:'lop',idempotency_key:'lidem',outcome:'fallback'
});
assert.equal(fallback.fallback_only,true);
assert.equal(fallback.execution_authority,false);

const serialized=JSON.stringify({handoff,negotiation,completed,recovery,fallback});
for(const forbidden of [
 'tenant_id','tenant_company_id','adapter_granted_authority":true','grants_authority":true',
 'execution_authority":true','identity_grants_authority":true'
]) assert.equal(serialized.includes(forbidden),false,forbidden);

console.log('PASS runtime adapter Pass10 final certification invariants');
