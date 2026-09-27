import assert from 'node:assert/strict';
import { WorkRuntimeAdapter } from '../titan-runtime/adapters/work-runtime-adapter.mjs';
import { RetrieverAdapter } from '../titan-runtime/adapters/retriever-adapter.mjs';
import { negotiateRuntimeAdapter, selectAdapterPath } from '../titan-runtime/adapters/adapter-negotiation.mjs';
import { createTypedLifecycle } from '../titan-runtime/adapters/typed-work-lifecycle.mjs';
import { prepareLegacyDomFallback, submitLegacyDomFallback } from '../titan-runtime/adapters/legacy-dom-discovery.mjs';
import { createAdapterSession, recoverAdapterSession, createReconnectPlan } from '../titan-runtime/adapters/adapter-session-recovery.mjs';

const gate=(company_id='company-A')=>({
  company_id,execution_allowed:true,decision_id:`decision-${company_id}`,
  authority_source:'Titan Governance',policy_version:'policy-v8',approval_state:'approved'
});

// Scenario 1: fully typed happy path.
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
  company_id:'company-A',work_id:'work-A',correlation_id:'corr-A',operation_id:'op-A',idempotency_key:'idem-A',
  execution_gate:gate('company-A'),payload:{goal:'Inspect current page'},context:{surface:'side-panel'}
});
const lifecycle=createTypedLifecycle(prepared,{started_at:1000,timeout_ms:5000});
assert.equal(lifecycle.accept({provider:'Retriever'}).envelope.type,'TITAN_WORK_ACCEPTED');
assert.equal(lifecycle.updateProgress({progress:0.4,current_step:'reading'}).envelope.type,'TITAN_WORK_PROGRESS');
const completed=lifecycle.complete({summary:'done'});
assert.equal(completed.envelope.type,'TITAN_WORK_COMPLETE');
assert.equal(completed.snapshot.state,'complete');
assert.equal(completed.snapshot.execution_authority,false);

// Scenario 2: typed path provider failure is fail closed.
const failedLife=createTypedLifecycle(prepared,{started_at:1000,timeout_ms:5000});
const failed=failedLife.fail({code:'PROVIDER_ERROR',message:'provider unavailable',retryable:true});
assert.equal(failed.envelope.type,'TITAN_WORK_ERROR');
assert.equal(failed.envelope.payload.fail_closed,true);
assert.equal(failed.envelope.payload.execution_authority,false);

// Scenario 3: timeout is explicit and retryability is not authority.
const timedLife=createTypedLifecycle(prepared,{started_at:1000,timeout_ms:5000});
const timed=timedLife.checkTimeout(6000);
assert.equal(timed.timed_out,true);
assert.equal(timed.envelope.payload.code,'WORK_TIMEOUT');
assert.equal(timed.envelope.payload.retryable,true);
assert.equal(timed.snapshot.execution_authority,false);

// Scenario 4: typed capability mismatch selects fallback only when explicitly available.
const fallbackNegotiation=negotiateRuntimeAdapter({
  local_runtime:'Titan',remote_runtime:'Retriever',local_version:'1.0',remote_version:'2.0',
  remote_capabilities:['work_submission'],legacy_fallback_available:true
});
assert.equal(selectAdapterPath({negotiation:fallbackNegotiation}).path,'legacy_fallback');
const fallback=prepareLegacyDomFallback({
  negotiation:fallbackNegotiation,company_id:'company-A',work_id:'work-F',correlation_id:'corr-F',
  operation_id:'op-F',idempotency_key:'idem-F',outcome:'Inspect fallback page'
});
assert.equal(fallback.transport.type,'TITAN_EXECUTE_OUTCOME');
assert.equal(fallback.telemetry.deprecated,true);
assert.equal(fallback.telemetry.contains_customer_content,false);
assert.equal(fallback.execution_authority,false);

const sent=[], telemetry=[];
const fallbackReceipt=await submitLegacyDomFallback({
  negotiation:fallbackNegotiation,company_id:'company-A',work_id:'work-F',correlation_id:'corr-F',
  operation_id:'op-F',idempotency_key:'idem-F',outcome:'Inspect fallback page'
},{
  telemetry:async event=>telemetry.push(event),
  send:async message=>{sent.push(message); return {accepted:true};}
});
assert.equal(sent.length,1);
assert.equal(telemetry.length,1);
assert.equal(fallbackReceipt.deprecated_path_used,true);
assert.equal(fallbackReceipt.execution_authority,false);

// Scenario 5: fallback is prohibited when typed path is healthy.
assert.throws(()=>prepareLegacyDomFallback({
  negotiation,company_id:'company-A',work_id:'work-X',correlation_id:'corr-X',operation_id:'op-X',
  idempotency_key:'idem-X',outcome:'Should not fallback'
}),/prohibited when typed adapter path is ready/);

// Scenario 6: company isolation on execution gate.
assert.throws(()=>adapter.prepareSubmission({
  company_id:'company-A',work_id:'work-cross',correlation_id:'corr-cross',operation_id:'op-cross',idempotency_key:'idem-cross',
  execution_gate:gate('company-B'),payload:{goal:'cross company'}
}),/company_id/);

// Scenario 7: Retriever compatibility transport preserves company and identifiers.
const retriever=new RetrieverAdapter({capabilities:['work_submission','progress_observation','result_delivery','cancellation']});
const retrieverPrepared=retriever.prepareRetrieverSubmission({
  company_id:'company-A',work_id:'work-R',correlation_id:'corr-R',operation_id:'op-R',idempotency_key:'idem-R',
  execution_gate:gate('company-A'),payload:{outcome:'Retrieve answer'}
});
assert.equal(retrieverPrepared.transport.message.type,'TITAN_EXECUTE_OUTCOME');
assert.equal(retrieverPrepared.transport.message.company_id,'company-A');
assert.equal(retrieverPrepared.transport.message.requestId,'work-R');
assert.equal(retrieverPrepared.transport.message.context.correlation_id,'corr-R');
assert.equal(retrieverPrepared.execution_authority,false);

// Scenario 8: navigation recovery requires fresh negotiation + authority evaluation.
const session=createAdapterSession({
  session_id:'session-A',company_id:'company-A',runtime:'Retriever',adapter_version:'1.0',correlation_id:'corr-A',
  work_id:'work-A',navigation_key:'page-1',epoch:0,created_at:1000,last_seen_at:2000,resumable:true,
  authority_snapshot_ref:'authority-old'
});
const recovered=recoverAdapterSession(session,{
  company_id:'company-A',navigation_key:'page-2',runtime:'Retriever',adapter_version:'1.0',now:2500,stale_after_ms:5000
});
assert.equal(recovered.recovered,true);
assert.equal(recovered.session.epoch,1);
assert.equal(recovered.session.authority_snapshot_ref,null);
assert.equal(recovered.requires_new_negotiation,true);
assert.equal(recovered.requires_fresh_authority_evaluation,true);
const reconnect=createReconnectPlan({company_id:'company-A',trigger:'navigation',recovery:recovered});
assert.deepEqual(reconnect.actions,['renegotiate_adapter','reevaluate_execution_authority']);
assert.equal(reconnect.auto_execute_after_reconnect,false);

// Scenario 9: cross-company session cannot resume.
const crossRecovery=recoverAdapterSession(session,{
  company_id:'company-B',navigation_key:'page-1',runtime:'Retriever',adapter_version:'1.0',now:2500
});
assert.equal(crossRecovery.recovered,false);
assert.equal(crossRecovery.recovery_status,'company_mismatch');
const crossPlan=createReconnectPlan({company_id:'company-B',trigger:'restart',recovery:crossRecovery});
assert.deepEqual(crossPlan.actions,['discard_stale_session','create_new_session','renegotiate_adapter','reevaluate_execution_authority']);
assert.equal(crossPlan.auto_execute_after_reconnect,false);

// Scenario 10: no negotiated cancellation capability means cancellation is unavailable.
const noCancelAdapter=new WorkRuntimeAdapter({runtime:'Retriever',capabilities:['work_submission','result_delivery']});
const noCancelPrepared=noCancelAdapter.prepareSubmission({
  company_id:'company-A',work_id:'work-NC',correlation_id:'corr-NC',operation_id:'op-NC',idempotency_key:'idem-NC',
  execution_gate:gate('company-A'),payload:{goal:'no cancel'}
});
assert.throws(()=>createTypedLifecycle(noCancelPrepared).cancellationRequest({company_id:'company-A'}),/not negotiated/);

// Scenario 11: legacy tenant aliases are rejected across externally supplied boundaries.
assert.throws(()=>adapter.prepareSubmission({
  company_id:'company-A',tenant_id:'legacy',work_id:'w',correlation_id:'c',operation_id:'o',idempotency_key:'i',
  execution_gate:gate('company-A'),payload:{goal:'bad'}
}),/legacy tenant/);
assert.throws(()=>recoverAdapterSession(session,{
  company_id:'company-A',tenant_company_id:'legacy',navigation_key:'page-1',runtime:'Retriever',adapter_version:'1.0'
}),/legacy tenant/);

// Scenario 12: serialized E2E outputs contain no true authority grants or legacy tenant boundaries.
const e2eOutputs={negotiation,completed,failed,timed,fallback,fallbackReceipt,retrieverPrepared,recovered,reconnect,crossRecovery,crossPlan};
const serialized=JSON.stringify(e2eOutputs);
for(const forbidden of [
  'tenant_id','tenant_company_id','adapter_granted_authority":true','grants_authority":true',
  'execution_authority":true','auto_execute_after_reconnect":true','identity_grants_authority":true'
]) assert.equal(serialized.includes(forbidden),false,forbidden);

console.log('PASS runtime adapter Pass08 end-to-end typed/fallback/failure/company/authority invariants');
