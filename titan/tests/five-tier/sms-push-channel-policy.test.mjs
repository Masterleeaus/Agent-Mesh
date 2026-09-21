import assert from 'node:assert/strict';
import test from 'node:test';
import {resolveCommunicationProvider,resolvePreferredCommunicationProvider,prepareCommunicationExecution} from '../../titan-workforce/hierarchy/communication-provider-binding-runtime.mjs';
const base={company_id:'co-123',worker_id:'titan.worker.customer_notification_agent'};
test('sms and push fail closed without verified host bindings',()=>{
  for(const channel of ['sms','push_notification']){ const r=resolveCommunicationProvider({...base,channel}); assert.equal(r.available,false); assert.equal(r.execution_permitted,false); assert.match(r.reason,/verified-host-binding-required/); }
});
test('verified host sms binding becomes selectable without granting authority',()=>{
  const host_capabilities=[{id:'channel.sms',title:'Titan Connect SMS',verified:true,activation_confers_authority:false}];
  const r=resolveCommunicationProvider({...base,channel:'sms',host_capabilities}); assert.equal(r.available,true); assert.equal(r.provider_id,'titan.connect.sms'); assert.equal(r.execution_permitted,false);
});
test('preference router falls back from unavailable sms to native whatsapp',()=>{
  const r=resolvePreferredCommunicationProvider({...base,preferred_channels:['sms','whatsapp','email'],allow_fallback:true}); assert.equal(r.available,true); assert.equal(r.channel,'whatsapp'); assert.equal(r.selection.fallback_used,true);
});
test('channel consent blocks fallback target',()=>{
  const r=resolvePreferredCommunicationProvider({...base,preferred_channels:['sms','whatsapp','email'],allow_fallback:true,channel_consent:{whatsapp:false}}); assert.equal(r.available,true); assert.equal(r.channel,'email');
});
test('protected communication remains authority gated',()=>{
  const r=prepareCommunicationExecution({...base,preferred_channels:['sms','email'],allow_fallback:true,approval_granted:true,idempotency_key:'idem-1',recipient_ref:'customer:7',content_ref:'message:9'});
  assert.equal(r.proposal.state,'READY_FOR_AUTHORITY_GATE'); assert.equal(r.execution_permitted,false); assert.equal(r.proposal.direct_send,false);
});
