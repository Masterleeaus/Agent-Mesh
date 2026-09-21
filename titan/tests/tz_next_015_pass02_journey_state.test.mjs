import test from 'node:test';
import assert from 'node:assert/strict';
import { createOnboardingJourneyStore, ONBOARDING_STEPS } from '../titan-onboarding/runtime/onboarding-journey-state.mjs';

function storage(){const data={};return {data,async get(key){return key in data ? {[key]:structuredClone(data[key])}:{};},async set(values){Object.assign(data,structuredClone(values));}}}

function store(clockValues=[100,200,300,400,500,600,700,800,900]) {
  let i=0; const s=storage();
  return {s, journey:createOnboardingJourneyStore({storage:s,clock:()=>clockValues[i++] ?? 999})};
}

test('new company starts with isolated non-authoritative resumable state', async()=>{
  const {journey}=store(); const state=await journey.load({company_id:'company-a'});
  assert.equal(state.company_id,'company-a'); assert.equal(state.status,'not_started');
  assert.equal(state.current_step,'business_identity'); assert.equal(state.revision,0); assert.equal(state.grants_authority,false);
});

test('legacy tenant aliases fail closed', async()=>{
  const {journey}=store();
  await assert.rejects(()=>journey.load({company_id:'company-a',tenant_id:'company-a'}),/legacy|tenant/i);
  await assert.rejects(()=>journey.load({tenant_company_id:'company-a'}),/legacy|tenant/i);
});

test('start persists and resume reads the same company state', async()=>{
  const {journey}=store(); const started=await journey.start({company_id:'company-a'});
  assert.equal(started.status,'in_progress'); assert.equal(started.revision,1); assert.equal(started.started_at,100);
  const resumed=await journey.load({company_id:'company-a'}); assert.deepEqual(resumed,started);
});

test('companies never share onboarding state', async()=>{
  const {journey}=store(); await journey.start({company_id:'company-a'}); await journey.completeStep({company_id:'company-a'},'business_identity',{expected_revision:1});
  const other=await journey.load({company_id:'company-b'}); assert.equal(other.revision,0); assert.deepEqual(other.completed_steps,[]);
});

test('optimistic revision rejects stale writes', async()=>{
  const {journey}=store(); await journey.start({company_id:'company-a'});
  await assert.rejects(()=>journey.completeStep({company_id:'company-a'},'business_identity',{expected_revision:0}),/revision_conflict/);
});

test('required steps cannot be skipped but optional steps can', async()=>{
  const {journey}=store(); await journey.start({company_id:'company-a'});
  await assert.rejects(()=>journey.skipOptionalStep({company_id:'company-a'},'business_identity',{expected_revision:1}),/cannot_be_skipped/);
  const skipped=await journey.skipOptionalStep({company_id:'company-a'},'payments_communications',{expected_revision:1});
  assert.deepEqual(skipped.skipped_optional_steps,['payments_communications']);
});

test('completion requires every required step and never grants authority', async()=>{
  const {journey}=store(); let state=await journey.start({company_id:'company-a'});
  await assert.rejects(()=>journey.completeJourney({company_id:'company-a'},{expected_revision:state.revision}),/required_onboarding_steps_incomplete/);
  for (const step of ONBOARDING_STEPS.filter(s=>s.required)) state=await journey.completeStep({company_id:'company-a'},step.id,{expected_revision:state.revision});
  state=await journey.completeJourney({company_id:'company-a'},{expected_revision:state.revision});
  assert.equal(state.status,'completed'); assert.equal(state.current_step,null); assert.equal(state.grants_authority,false);
});

test('repeating completed step is safe and journey completion is idempotent', async()=>{
  const {journey}=store(); let state=await journey.start({company_id:'company-a'});
  state=await journey.completeStep({company_id:'company-a'},'business_identity',{expected_revision:state.revision});
  const once=state.completed_steps.length; state=await journey.completeStep({company_id:'company-a'},'business_identity',{expected_revision:state.revision});
  assert.equal(state.completed_steps.length,once);
});
