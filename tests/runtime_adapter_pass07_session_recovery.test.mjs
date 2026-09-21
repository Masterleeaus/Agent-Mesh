import assert from 'node:assert/strict';
import {
  createAdapterSession,
  classifyAdapterSession,
  recoverAdapterSession,
  createReconnectPlan
} from '../titan-runtime/adapters/adapter-session-recovery.mjs';

const session=createAdapterSession({
  session_id:'session-1',
  company_id:'company-1',
  runtime:'Retriever',
  adapter_version:'1.0',
  correlation_id:'corr-1',
  work_id:'work-1',
  navigation_key:'page-A',
  epoch:2,
  created_at:1000,
  last_seen_at:2000,
  resumable:true,
  authority_snapshot_ref:'auth-1'
});

assert.equal(session.company_id,'company-1');
assert.equal(session.adapter_granted_authority,false);
assert.equal(session.execution_authority,false);

const current=classifyAdapterSession(session,{
  company_id:'company-1',
  navigation_key:'page-A',
  runtime:'Retriever',
  adapter_version:'1.0',
  now:2500,
  stale_after_ms:1000
});
assert.equal(current.status,'current');
assert.equal(current.recoverable,true);

const nav=classifyAdapterSession(session,{
  company_id:'company-1',
  navigation_key:'page-B',
  runtime:'Retriever',
  adapter_version:'1.0',
  now:2500,
  stale_after_ms:1000
});
assert.equal(nav.status,'navigation_resumable');
assert.equal(nav.recoverable,true);

const navRecovery=recoverAdapterSession(session,{
  company_id:'company-1',
  navigation_key:'page-B',
  runtime:'Retriever',
  adapter_version:'1.0',
  now:2500,
  stale_after_ms:1000
});
assert.equal(navRecovery.recovered,true);
assert.equal(navRecovery.session.epoch,3);
assert.equal(navRecovery.session.navigation_key,'page-B');
assert.equal(navRecovery.session.authority_snapshot_ref,null);
assert.equal(navRecovery.requires_new_negotiation,true);
assert.equal(navRecovery.requires_fresh_authority_evaluation,true);

const plan=createReconnectPlan({
  company_id:'company-1',
  trigger:'navigation',
  recovery:navRecovery
});
assert.deepEqual(plan.actions,['renegotiate_adapter','reevaluate_execution_authority']);
assert.equal(plan.auto_execute_after_reconnect,false);
assert.equal(plan.execution_authority,false);

const stale=recoverAdapterSession(session,{
  company_id:'company-1',
  navigation_key:'page-A',
  runtime:'Retriever',
  adapter_version:'1.0',
  now:4000,
  stale_after_ms:1000
});
assert.equal(stale.recovery_status,'stale_resumable');
assert.equal(stale.session.epoch,3);
assert.equal(stale.session.authority_snapshot_ref,null);

const mismatch=recoverAdapterSession(session,{
  company_id:'company-2',
  navigation_key:'page-A',
  runtime:'Retriever',
  adapter_version:'1.0',
  now:2500
});
assert.equal(mismatch.recovered,false);
assert.equal(mismatch.recovery_status,'company_mismatch');
assert.equal(mismatch.requires_fresh_authority_evaluation,true);

const mismatchPlan=createReconnectPlan({
  company_id:'company-2',
  trigger:'restart',
  recovery:mismatch
});
assert.deepEqual(mismatchPlan.actions,['discard_stale_session','create_new_session','renegotiate_adapter','reevaluate_execution_authority']);
assert.equal(mismatchPlan.auto_execute_after_reconnect,false);

const versionChanged=recoverAdapterSession(session,{
  company_id:'company-1',
  navigation_key:'page-A',
  runtime:'Retriever',
  adapter_version:'2.0',
  now:2500
});
assert.equal(versionChanged.recovered,false);
assert.equal(versionChanged.recovery_status,'version_changed');

const runtimeChanged=recoverAdapterSession(session,{
  company_id:'company-1',
  navigation_key:'page-A',
  runtime:'OtherRuntime',
  adapter_version:'1.0',
  now:2500
});
assert.equal(runtimeChanged.recovered,false);
assert.equal(runtimeChanged.recovery_status,'runtime_changed');

const nonResumable=createAdapterSession({
  session_id:'session-2',
  company_id:'company-1',
  runtime:'Retriever',
  adapter_version:'1.0',
  correlation_id:'corr-2',
  navigation_key:'page-A',
  created_at:1000,
  last_seen_at:2000,
  resumable:false
});
const nonResume=recoverAdapterSession(nonResumable,{
  company_id:'company-1',
  navigation_key:'page-B',
  runtime:'Retriever',
  adapter_version:'1.0',
  now:2500
});
assert.equal(nonResume.recovered,false);
assert.equal(nonResume.recovery_status,'navigation_non_resumable');

assert.throws(()=>createAdapterSession({
  session_id:'s',company_id:'company-1',runtime:'Retriever',adapter_version:'1.0',correlation_id:'c',navigation_key:'p',tenant_id:'legacy'
}),/legacy tenant/);

for (const obj of [session,current,nav,navRecovery,plan,stale,mismatch,mismatchPlan,versionChanged,runtimeChanged,nonResume]) {
  const s=JSON.stringify(obj);
  for (const forbidden of ['tenant_id','tenant_company_id','adapter_granted_authority":true','grants_authority":true','execution_authority":true','auto_execute_after_reconnect":true']) {
    assert.equal(s.includes(forbidden),false);
  }
}
console.log('PASS runtime adapter Pass07 session recovery invariants');
