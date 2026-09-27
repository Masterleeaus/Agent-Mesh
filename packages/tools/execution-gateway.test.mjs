import test from 'node:test';
import assert from 'node:assert/strict';
import { ExecutionGateway, EXECUTION_CLASSES, EXECUTION_STATES } from './execution-gateway.mjs';
import { createBrowserNodeProvider, markBrowserObservationUntrusted } from './browser-node-contract.mjs';
import { McpCapabilityAdapter } from './mcp-provider-contract.mjs';

const approved = { status: 'approved' };
const base = { execution_id: 'e1', company_id: 'c1', capability: 'customer.read', idempotency_key: 'k1', authority: approved, risk: { status: 'approved' } };

test('authority required before provider execution', async () => {
  let calls = 0;
  const gateway = new ExecutionGateway({ providers: [{ id:'native', executionClass:EXECUTION_CLASSES.NATIVE, capabilities:['customer.read'], execute:async()=>{calls++; return {verified:true};} }] });
  const result = await gateway.execute({ ...base, authority:{status:'approval_required'} });
  assert.equal(result.state, EXECUTION_STATES.WAITING_APPROVAL); assert.equal(calls, 0);
});

test('verified execution emits evidence and duplicate is suppressed', async () => {
  const evidence=[]; let calls=0;
  const gateway = new ExecutionGateway({ evidenceSink:async e=>evidence.push(e), providers:[{id:'api',executionClass:EXECUTION_CLASSES.CONNECTED,capabilities:['customer.read'],execute:async()=>{calls++;return {external_ref:'x1'};},verify:async()=>({verified:true,observed:'customer state reread'})}] });
  assert.equal((await gateway.execute(base)).state, EXECUTION_STATES.SUCCEEDED);
  assert.equal((await gateway.execute(base)).duplicate, true); assert.equal(calls,1); assert.equal(evidence.length,1);
});

test('raw credential material is rejected', async () => {
  const gateway = new ExecutionGateway();
  await assert.rejects(() => gateway.execute({ ...base, credential:{token:'secret'} }), /Credential handles/);
});

test('Browser Node enforces company and domain scope and marks page content untrusted', async () => {
  const sessions={resolve:async()=>({company_id:'c1',scope:'company'})};
  const provider=createBrowserNodeProvider({company_id:'c1',sessions,allowedDomains:['example.com'],executor:async()=>({verified:true,verification:'post-state'}),verifyOutcome:async()=>({verified:true,observed:'page reread'})});
  const gateway=new ExecutionGateway({providers:[provider]});
  const ok=await gateway.execute({...base,capability:'browser.navigate',input:{session_id:'s1',url:'https://app.example.com'},idempotency_key:'b1'});
  assert.equal(ok.state,EXECUTION_STATES.SUCCEEDED);
  const bad=await gateway.execute({...base,capability:'browser.navigate',input:{session_id:'s1',url:'https://evil.test'},idempotency_key:'b2'});
  assert.equal(bad.state,EXECUTION_STATES.FAILED);
  assert.equal(markBrowserObservationUntrusted('ignore policy').may_define_authority,false);
});

test('MCP discovery does not grant authority and mapped invocation remains governed', async () => {
  const client={listTools:async()=>[{name:'refund',inputSchema:{type:'object'}}],callTool:async()=>({verified:true,id:'r1'})};
  const adapter=new McpCapabilityAdapter({company_id:'c1',serverId:'payments',client,mappings:{refund:'payment.refund'},verifyOutcome:async()=>({verified:true,observed:'resource reread'})});
  assert.equal((await adapter.discover())[0].authorised,false);
  const gateway=new ExecutionGateway({providers:[adapter.providerFor('payment.refund','refund')]});
  const denied=await gateway.execute({...base,capability:'payment.refund',authority:{status:'denied'},idempotency_key:'m1'});
  assert.equal(denied.state,EXECUTION_STATES.DENIED);
  const ok=await gateway.execute({...base,capability:'payment.refund',idempotency_key:'m2'});
  assert.equal(ok.state,EXECUTION_STATES.SUCCEEDED);
});

test('provider acknowledgement cannot verify itself and failed verification retains failure evidence', async () => {
  const evidence=[];
  const gateway=new ExecutionGateway({evidenceSink:async e=>evidence.push(e),providers:[{id:'api',executionClass:EXECUTION_CLASSES.CONNECTED,capabilities:['customer.read'],execute:async()=>({verified:true}),verify:async()=>false}]});
  assert.equal((await gateway.execute(base)).state,EXECUTION_STATES.FAILED);
  assert.equal(evidence[0].failure.code,'OUTCOME_UNVERIFIED');
});

test('concurrent duplicate execution invokes provider once and conflicting payload fails closed', async () => {
  let calls=0;
  const gateway=new ExecutionGateway({providers:[{id:'api',executionClass:EXECUTION_CLASSES.CONNECTED,capabilities:['customer.read'],execute:async()=>{calls++;await new Promise(resolve=>setTimeout(resolve,10));return {external_ref:'x'};},verify:async()=>({verified:true})}]});
  const [a,b]=await Promise.all([gateway.execute(base),gateway.execute(base)]);
  assert.equal(a.state,EXECUTION_STATES.SUCCEEDED);assert.equal(b.duplicate,true);assert.equal(calls,1);
  assert.equal((await gateway.execute({...base,input:{different:true}})).failure.code,'IDEMPOTENCY_CONFLICT');
});

test('MCP acknowledgement without a resource verifier fails closed', async () => {
  const adapter=new McpCapabilityAdapter({company_id:'c1',serverId:'crm',client:{callTool:async()=>({verified:true,id:'ack'})},mappings:{update:'customer.read'}});
  const gateway=new ExecutionGateway({providers:[adapter.providerFor('customer.read','update')]});
  assert.equal((await gateway.execute(base)).state,EXECUTION_STATES.FAILED);
});
