import test from 'node:test';
import assert from 'node:assert/strict';
import { projectOnboardingReadiness, createOnboardingReadinessService } from '../titan-onboarding/runtime/onboarding-readiness.mjs';

const configured = {
  company_id:'c1',
  journey:{company_id:'c1',status:'in_progress',revision:4,current_step:'readiness',completed_steps:['business_identity','operations','cleaning_services','workforce'],skipped_optional_steps:[],grants_authority:false},
  business:{company_id:'c1',revision:1,identity:{legal_name:'Example Cleaning'},contact:{email:'ops@example.com'},service_areas:[{postcode:'3000'}],operating_hours:{monday:{open:'09:00',close:'17:00'}},authority_granted:false,execution_permitted:false},
  cleaning:{company_id:'c1',revision:1,selections:[{job_type_id:'standard-clean'}],authority_granted:false,execution_permitted:false},
  workforce:{company_id:'c1',revision:1,role_selections:[{role_definition_id:'cleaner',enabled:true}],availability:{timezone:'Australia/Melbourne'},escalation_defaults:[],role_activation_permitted:false,worker_creation_permitted:false,scheduling_execution_permitted:false,escalation_execution_permitted:false,authority_granted:false,execution_permitted:false},
  payments:null,
  imports:null,
};

test('Pass8 reports required setup configured while untouched optional setup stays optional',()=>{
  const out=projectOnboardingReadiness(configured);
  assert.equal(out.status,'ready');
  assert.equal(out.operationally_ready,true);
  assert.deepEqual(out.optional_ids,['payments_communications','import_data']);
  assert.equal(out.counts.required_configured,out.counts.required_total);
  assert.equal(out.execution_permitted,false);
});

test('Pass8 reports missing required setup without treating optional setup as a blocker',()=>{
  const out=projectOnboardingReadiness({...configured,cleaning:{company_id:'c1',revision:0,selections:[]}});
  assert.equal(out.status,'missing');
  assert.equal(out.operationally_ready,false);
  assert.deepEqual(out.missing_required_ids,['cleaning_services']);
  assert.equal(out.blocked_ids.length,0);
});

test('Pass8 blocks unsafe authority or execution leakage',()=>{
  const out=projectOnboardingReadiness({...configured,workforce:{...configured.workforce,execution_permitted:true}});
  assert.equal(out.status,'blocked');
  assert.ok(out.blocked_ids.includes('workforce_setup'));
  assert.equal(out.operationally_ready,false);
});

test('Pass8 rejects cross-company and legacy readiness sources',()=>{
  assert.throws(()=>projectOnboardingReadiness({...configured,business:{...configured.business,company_id:'c2'}}),/Cross-company/);
  assert.throws(()=>projectOnboardingReadiness({...configured,tenant_id:'legacy'}),/legacy company boundary/);
});

test('Pass8 marks configured optional areas without making them execution authorities',()=>{
  const out=projectOnboardingReadiness({...configured,payments:{company_id:'c1',revision:1,payments:{methods:['payid']},communications:[{capability_id:'channel.gmail'}],providers:{providers:[]},credentials_stored_in_onboarding:false,authority_granted:false,execution_permitted:false},imports:{import_id:'imp1',status:'STAGED',rollback_safe:true,invalid_count:0,live_mutation_permitted:false,authority_granted:false,execution_permitted:false}});
  assert.equal(out.status,'ready');
  assert.equal(out.items.find(x=>x.id==='payments_communications').status,'configured');
  assert.equal(out.items.find(x=>x.id==='import_data').status,'configured');
  assert.equal(out.grants_authority,false);
});

test('Pass8 readiness service fails closed when an underlying source cannot be read',async()=>{
  const ok={read:async()=>configured.business};
  const service=createOnboardingReadinessService({
    journeyStore:{load:async()=>configured.journey},
    businessSetup:ok,
    cleaningSetup:{read:async()=>{throw new Error('storage unavailable')}},
    workforceSetup:{read:async()=>configured.workforce},
    paymentsCommunicationsSetup:{read:async()=>({company_id:'c1',revision:0,authority_granted:false,execution_permitted:false})},
  });
  const out=await service.evaluate({company_id:'c1'});
  assert.equal(out.status,'blocked');
  assert.equal(out.operationally_ready,false);
  assert.ok(out.source_errors.some(x=>x.includes('storage unavailable')));
  assert.ok(out.blocked_ids.includes('readiness_source_error'));
});
