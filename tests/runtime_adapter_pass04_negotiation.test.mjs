import assert from 'node:assert/strict';
import { detectAdapterFeatures, negotiateRuntimeAdapter, selectAdapterPath } from '../titan-runtime/adapters/adapter-negotiation.mjs';

const features=detectAdapterFeatures({runtime:'Retriever',typed_adapter_hello:true,message_transport:true,progress_observation:true,result_delivery:true,cancellation:false,legacy_dom_fallback:true});
assert.deepEqual(features.detected_capabilities,['work_submission','progress_observation','result_delivery']);
assert.equal(features.discovery_grants_permission,false);
assert.equal(features.discovery_grants_authority,false);
assert.equal(features.execution_authority,false);

const ready=negotiateRuntimeAdapter({
  local_runtime:'Titan',remote_runtime:'Retriever',local_version:'1.2',remote_version:'1.1',
  local_capabilities:['work_submission','progress_observation','result_delivery','cancellation'],
  remote_capabilities:['work_submission','progress_observation','result_delivery'],
  required_capabilities:['work_submission','result_delivery'],
  legacy_fallback_available:true
});
assert.equal(ready.status,'ready');
assert.equal(ready.selected_version,'1.1');
assert.deepEqual(ready.selected_capabilities,['progress_observation','result_delivery','work_submission']);
assert.equal(ready.capability_negotiation_grants_permission,false);
assert.equal(ready.capability_negotiation_grants_authority,false);
assert.equal(ready.execution_authority,false);
assert.deepEqual(selectAdapterPath({negotiation:ready}),{
  path:'typed',reason:'compatible_version_and_required_capabilities',selected_version:'1.1',
  selected_capabilities:['progress_observation','result_delivery','work_submission'],
  permission_granted:false,authority_granted:false,execution_authority:false
});

const versionBad=negotiateRuntimeAdapter({
  local_runtime:'Titan',remote_runtime:'Retriever',local_version:'1.0',remote_version:'2.0',
  remote_capabilities:['work_submission'],legacy_fallback_available:true
});
assert.equal(versionBad.status,'incompatible');
assert.equal(selectAdapterPath({negotiation:versionBad}).path,'legacy_fallback');

const capabilityBad=negotiateRuntimeAdapter({
  local_runtime:'Titan',remote_runtime:'Retriever',local_version:'1.0',remote_version:'1.0',
  local_capabilities:['work_submission','result_delivery'],remote_capabilities:['work_submission'],
  required_capabilities:['work_submission','result_delivery'],legacy_fallback_available:false
});
assert.equal(capabilityBad.status,'capability_mismatch');
assert.deepEqual(capabilityBad.missing_required_capabilities,['result_delivery']);
assert.equal(selectAdapterPath({negotiation:capabilityBad}).path,'unavailable');

const missingVersion=negotiateRuntimeAdapter({local_runtime:'Titan',remote_runtime:'Retriever',legacy_fallback_available:true});
assert.equal(missingVersion.status,'typed_adapter_unavailable');
assert.equal(selectAdapterPath({negotiation:missingVersion}).path,'legacy_fallback');

assert.throws(()=>detectAdapterFeatures({runtime:'Retriever',tenant_id:'legacy'}),/legacy tenant/);
assert.throws(()=>negotiateRuntimeAdapter({local_runtime:'Titan',remote_runtime:'Retriever',tenant_company_id:'legacy'}),/legacy tenant/);

for(const obj of [features,ready,versionBad,capabilityBad,missingVersion]) {
  const s=JSON.stringify(obj);
  for(const forbidden of ['permission_granted":true','authority_granted":true','execution_authority":true']) assert.equal(s.includes(forbidden),false);
}
console.log('PASS runtime adapter Pass04 negotiation + feature detection invariants');
