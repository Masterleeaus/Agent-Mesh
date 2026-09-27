import test from 'node:test';
import assert from 'node:assert/strict';
import { createOnboardingJourneyStore } from '../titan-onboarding/runtime/onboarding-journey-state.mjs';
import { projectOnboardingReadiness } from '../titan-onboarding/runtime/onboarding-readiness.mjs';

function storage(){const data={};return {async get(k){return k in data?{[k]:structuredClone(data[k])}:{}},async set(v){Object.assign(data,structuredClone(v))}}}

const company_id='co-final';
const configured={
  business:{company_id,revision:1,identity:{legal_name:'Final Cleaning Pty Ltd'},contact:{email:'ops@example.com'},service_areas:[{postcode:'3000'}],operating_hours:{monday:{open:'09:00',close:'17:00'}},authority_granted:false,execution_permitted:false},
  cleaning:{company_id,revision:1,selections:[{job_type_id:'standard-clean'}],authority_granted:false,execution_permitted:false},
  workforce:{company_id,revision:1,role_selections:[{role_definition_id:'cleaner',enabled:true}],availability:{timezone:'Australia/Melbourne'},escalation_defaults:[],role_activation_permitted:false,worker_creation_permitted:false,scheduling_execution_permitted:false,escalation_execution_permitted:false,authority_granted:false,execution_permitted:false},
  payments:null,imports:null,
};

test('Pass10 certifies completed onboarding remains persistence-backed, ready and non-authoritative',async()=>{
  const backing=storage();
  const first=createOnboardingJourneyStore({storage:backing,clock:()=>100});
  let state=await first.start({company_id});
  for(const step of ['business_identity','operations','cleaning_services','workforce']) state=await first.completeStep({company_id},step,{expected_revision:state.revision});
  state=await first.skipOptionalStep({company_id},'payments_communications',{expected_revision:state.revision});
  state=await first.skipOptionalStep({company_id},'import_data',{expected_revision:state.revision});
  state=await first.completeStep({company_id},'readiness',{expected_revision:state.revision});
  state=await first.completeJourney({company_id},{expected_revision:state.revision});
  const restarted=createOnboardingJourneyStore({storage:backing,clock:()=>999});
  const persisted=await restarted.load({company_id});
  const report=projectOnboardingReadiness({company_id,journey:persisted,...configured});
  assert.equal(persisted.status,'completed');
  assert.equal(persisted.current_step,null);
  assert.equal(persisted.grants_authority,false);
  assert.equal(report.status,'ready');
  assert.equal(report.operationally_ready,true);
  assert.equal(report.execution_permitted,false);
  assert.equal(report.grants_authority,false);
});
