import assert from 'node:assert/strict';
import { WorkRuntimeAdapter } from '../titan-runtime/adapters/work-runtime-adapter.mjs';
import { createTypedLifecycle } from '../titan-runtime/adapters/typed-work-lifecycle.mjs';

const gate={company_id:'company-1',execution_allowed:true,decision_id:'decision-1',authority_source:'Titan Governance',policy_version:'policy-v8',approval_state:'approved'};
const adapter=new WorkRuntimeAdapter({runtime:'Retriever',capabilities:['work_submission','progress_observation','result_delivery','cancellation']});
const prepared=adapter.prepareSubmission({company_id:'company-1',work_id:'work-1',correlation_id:'corr-1',operation_id:'op-1',idempotency_key:'idem-1',execution_gate:gate,context:{page_title:'Page'},payload:{goal:'Inspect'}});

const lifecycle=createTypedLifecycle(prepared,{started_at:1000,timeout_ms:5000});
assert.equal(lifecycle.snapshot().state,'submitted');
const accepted=lifecycle.accept({runtime:'Retriever'});
assert.equal(accepted.snapshot.state,'accepted');
assert.equal(accepted.envelope.type,'TITAN_WORK_ACCEPTED');
const p1=lifecycle.updateProgress({progress:0.25,current_step:'Reading'});
assert.equal(p1.snapshot.state,'working');
assert.equal(p1.envelope.type,'TITAN_WORK_PROGRESS');
assert.equal(p1.envelope.payload.progress,0.25);
assert.throws(()=>lifecycle.updateProgress({progress:0.2}),/cannot move backwards/);
const p2=lifecycle.updateProgress({progress:0.8,current_step:'Checking'});
assert.equal(p2.snapshot.progress,0.8);
const done=lifecycle.complete({summary:'ok'});
assert.equal(done.snapshot.state,'complete');
assert.equal(done.snapshot.progress,1);
assert.equal(done.envelope.type,'TITAN_WORK_COMPLETE');
assert.throws(()=>lifecycle.complete({}),/terminal/);

const failure=createTypedLifecycle(prepared,{started_at:1000,timeout_ms:5000});
const failed=failure.fail({code:'PROVIDER_ERROR',message:'Provider failed',retryable:true});
assert.equal(failed.snapshot.state,'error');
assert.equal(failed.envelope.type,'TITAN_WORK_ERROR');
assert.equal(failed.envelope.payload.code,'PROVIDER_ERROR');
assert.equal(failed.envelope.payload.fail_closed,true);

const timeout=createTypedLifecycle(prepared,{started_at:1000,timeout_ms:5000});
assert.equal(timeout.checkTimeout(5999).timed_out,false);
const timed=timeout.checkTimeout(6000);
assert.equal(timed.timed_out,true);
assert.equal(timed.snapshot.state,'timed_out');
assert.equal(timed.envelope.payload.code,'WORK_TIMEOUT');
assert.equal(timed.envelope.payload.retryable,true);

const cancellation=createTypedLifecycle(prepared,{started_at:1000,timeout_ms:5000});
const cancelReq=cancellation.cancellationRequest({company_id:'company-1',reason:'user_requested'});
assert.equal(cancelReq.type,'TITAN_WORK_CANCEL');
const cancelled=cancellation.cancel({company_id:'company-1',reason:'user_requested'});
assert.equal(cancelled.snapshot.state,'cancelled');
assert.equal(cancelled.envelope.type,'TITAN_WORK_CANCELLED');
assert.throws(()=>cancellation.cancel({company_id:'company-1'}),/terminal/);
assert.throws(()=>createTypedLifecycle(prepared).cancel({company_id:'company-2'}),/must match/);
assert.throws(()=>createTypedLifecycle(prepared).cancel({company_id:'company-1',tenant_id:'legacy'}),/legacy tenant/);

const noCancelAdapter=new WorkRuntimeAdapter({runtime:'NoCancel',capabilities:['work_submission']});
const noCancelPrepared=noCancelAdapter.prepareSubmission({company_id:'company-1',work_id:'work-2',correlation_id:'corr-2',operation_id:'op-2',idempotency_key:'idem-2',execution_gate:gate,payload:{goal:'Inspect'}});
assert.throws(()=>createTypedLifecycle(noCancelPrepared).cancellationRequest({company_id:'company-1'}),/not negotiated/);

for (const obj of [accepted,p1,p2,done,failed,timed,cancelReq,cancelled]) {
  const s=JSON.stringify(obj);
  for (const forbidden of ['tenant_id','tenant_company_id','adapter_granted_authority":true','execution_authority":true']) assert.equal(s.includes(forbidden),false);
}
console.log('PASS runtime adapter Pass06 typed lifecycle invariants');
