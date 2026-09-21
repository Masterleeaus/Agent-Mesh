import assert from 'node:assert/strict';
import {
 TITAN_EXECUTION_ADAPTER_PROTOCOL,TITAN_EXECUTION_ADAPTER_VERSION,TITAN_ADAPTER_MESSAGE_TYPES,
 createAdapterHello,createAdapterEnvelope,createAdapterError,validateAdapterEnvelope,
 negotiateAdapterVersion,negotiateAdapterCapabilities
} from '../titan-runtime/adapters/execution-adapter-protocol.mjs';

assert.equal(TITAN_EXECUTION_ADAPTER_PROTOCOL,'TITAN_EXECUTION_ADAPTER');
assert.equal(TITAN_EXECUTION_ADAPTER_VERSION,'1.0');

const hello=createAdapterHello({runtime:'Retriever',version:'1.2',capabilities:['work_submission','result_delivery']});
assert.equal(hello.type,'TITAN_ADAPTER_HELLO');
assert.equal(hello.execution_authority,false);
assert.equal(hello.capability_advertisement_grants_authority,false);

assert.deepEqual(negotiateAdapterVersion('1.3','1.1'),{compatible:true,selected_version:'1.1',error:null});
const badVersion=negotiateAdapterVersion('1.0','2.0');
assert.equal(badVersion.compatible,false);
assert.equal(badVersion.error.code,'ADAPTER_VERSION_INCOMPATIBLE');
assert.equal(badVersion.error.retryable,false);

assert.deepEqual(negotiateAdapterCapabilities(['work_submission','result_delivery'],['result_delivery','progress_observation']),['result_delivery']);

const base={type:TITAN_ADAPTER_MESSAGE_TYPES.WORK_SUBMIT,company_id:'company-1',work_id:'work-1',correlation_id:'corr-1',operation_id:'op-1',idempotency_key:'idem-1',context:{page_title:'Page'},payload:{goal:'inspect'}};
const env=createAdapterEnvelope(base);
assert.equal(env.company_id,'company-1');
assert.equal(env.context.company_id,'company-1');
assert.equal(env.authority.execution_authority,false);
assert.equal(env.authority.adapter_activation_grants_authority,false);
assert.equal(env.authority.capability_negotiation_grants_authority,false);
assert.throws(()=>createAdapterEnvelope({...base,tenant_id:'legacy'}),/legacy tenant/);
assert.throws(()=>createAdapterEnvelope({...base,company_id:''}),/company_id/);
assert.throws(()=>createAdapterEnvelope({...base,execution_authority:true}),/cannot grant execution authority/);
assert.throws(()=>createAdapterEnvelope({...base,type:'TITAN_EXECUTE_OUTCOME'}),/unsupported/);

const invalid=validateAdapterEnvelope({...base,correlation_id:''});
assert.equal(invalid.ok,false);
assert.equal(invalid.error.code,'ADAPTER_ENVELOPE_INVALID');
assert.equal(invalid.error.fail_closed,true);
assert.equal(invalid.error.execution_authority,false);

const err=createAdapterError({company_id:'company-1',work_id:'work-1',correlation_id:'corr-1',code:'TIMEOUT',retryable:true});
assert.equal(err.retryable,true);
assert.equal(err.fail_closed,true);
assert.equal(err.execution_authority,false);

const serialized=JSON.stringify({hello,env,invalid,err});
for(const forbidden of ['tenant_id','tenant_company_id','execution_authority":true']) assert.equal(serialized.includes(forbidden),false);
console.log('PASS runtime adapter Pass02 typed protocol invariants');
