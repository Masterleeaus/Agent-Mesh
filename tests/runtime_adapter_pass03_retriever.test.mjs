import assert from 'node:assert/strict';
import { WorkRuntimeAdapter, validateExternalExecutionGate } from '../titan-runtime/adapters/work-runtime-adapter.mjs';
import { RetrieverAdapter, RETRIEVER_COMPAT_EXECUTE_TYPE } from '../titan-runtime/adapters/retriever-adapter.mjs';

const gate={company_id:'company-1',execution_allowed:true,decision_id:'decision-1',authority_source:'Titan Governance',policy_version:'policy-v7',approval_state:'approved'};
const base={company_id:'company-1',work_id:'work-1',correlation_id:'corr-1',operation_id:'op-1',idempotency_key:'idem-1',execution_gate:gate,context:{page_title:'Example'},payload:{goal:'Inspect the page',display_outcome:'Inspect page'}};

const generic=new WorkRuntimeAdapter({runtime:'TestRuntime'});
const genericPrepared=generic.prepareSubmission(base);
assert.equal(genericPrepared.envelope.company_id,'company-1');
assert.equal(genericPrepared.gate.externally_authorized,true);
assert.equal(genericPrepared.adapter_granted_authority,false);
assert.equal(genericPrepared.execution_authority,false);
assert.equal(genericPrepared.transport_performed,false);

assert.throws(()=>validateExternalExecutionGate({...gate,execution_allowed:false}),/explicitly allow/);
assert.throws(()=>validateExternalExecutionGate({...gate,identity_only:true}),/identity cannot grant/);
assert.throws(()=>generic.prepareSubmission({...base,execution_gate:{...gate,company_id:'company-2'}}),/must match/);

const retriever=new RetrieverAdapter();
const prepared=retriever.prepareRetrieverSubmission(base);
assert.equal(prepared.transport.message.type,RETRIEVER_COMPAT_EXECUTE_TYPE);
assert.equal(prepared.transport.message.type,'TITAN_EXECUTE_OUTCOME');
assert.equal(prepared.transport.message.requestId,'work-1');
assert.equal(prepared.transport.message.company_id,'company-1');
assert.equal(prepared.transport.message.context.correlation_id,'corr-1');
assert.equal(prepared.transport.message.context.operation_id,'op-1');
assert.equal(prepared.transport.message.context.idempotency_key,'idem-1');
assert.equal(prepared.transport.message.context.titan_adapter.typed_work_type,'TITAN_WORK_SUBMIT');
assert.equal(prepared.transport.message.authority.adapter_grants_authority,false);
assert.equal(prepared.transport.protected_bridge_modified,false);
assert.equal(prepared.transport_performed,false);

const sent=[];
const receipt=await retriever.submit(base,{send:async msg=>{sent.push(msg);return {accepted:true};}});
assert.equal(sent.length,1);
assert.equal(sent[0].type,'TITAN_EXECUTE_OUTCOME');
assert.equal(receipt.transport_performed,true);
assert.equal(receipt.external_authority_consumed,true);
assert.equal(receipt.adapter_granted_authority,false);
assert.equal(receipt.execution_authority,false);

assert.throws(()=>retriever.prepareRetrieverSubmission({...base,payload:{}}),/requires outcome/);
assert.throws(()=>retriever.prepareRetrieverSubmission({...base,tenant_id:'legacy'}),/legacy tenant/);
assert.throws(()=>retriever.prepareRetrieverSubmission({...base,company_id:'company-2'}),/must match/);

const serial=JSON.stringify({genericPrepared,prepared,receipt});
for(const forbidden of ['tenant_id','tenant_company_id','identity_grants_authority":true','adapter_granted_authority":true','execution_authority":true']) assert.equal(serial.includes(forbidden),false);
console.log('PASS runtime adapter Pass03 work-runtime + Retriever adapter invariants');
