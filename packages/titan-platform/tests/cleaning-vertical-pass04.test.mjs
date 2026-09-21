import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCleaningOnboardingSetup, toRetainedCleaningServiceSetupPayload } from '../.cleaning-test-dist/verticals/cleaning/onboarding.js';

const base=()=>({
  company_id:'company-a',offered_service_ids:['regular_clean','airbnb_turnover','commercial_clean'],service_areas:[{id:'north',label:'Northern suburbs',postcodes:['3071','3072'],travel_radius_km:20}],enabled_pricing_modes:['hourly','fixed','quote_required'],team_capacity:{default_crew_size:1,max_parallel_crews:4,max_workers_per_crew:3},operating_hours:[{day:'monday',start:'08:00',end:'17:00'},{day:'saturday',start:'09:00',end:'14:00'}],equipment_defaults:['vacuum','mop'],supply_defaults:['microfibre','general cleaner'],recurring:{enabled:true,supported_frequencies:['weekly','fortnightly'],default_frequency:'fortnightly'}
});

test('Pass4 creates cleaning-native onboarding without handyman terminology or authority',()=>{
  const setup=buildCleaningOnboardingSetup(base());
  assert.equal(setup.company_id,'company-a');
  assert.equal(setup.configuration_only,true);
  assert.equal(setup.grants_authority,false);
  assert.equal(setup.execution_permitted,false);
  assert.equal(setup.persists_business_truth,false);
  assert.equal(JSON.stringify(setup).toLowerCase().includes('handyman'),false);
});

test('selected services are canonical catalogue projections',()=>{
  const setup=buildCleaningOnboardingSetup(base());
  assert.deepEqual(setup.offered_services.map(s=>s.service_id),['regular_clean','airbnb_turnover','commercial_clean']);
  assert.ok(setup.offered_services.every(s=>s.label && s.pricing_hints.length));
});

test('service areas, hours and team capacity are validated',()=>{
  assert.throws(()=>buildCleaningOnboardingSetup({...base(),service_areas:[]}),/service area/);
  assert.throws(()=>buildCleaningOnboardingSetup({...base(),operating_hours:[{day:'monday',start:'17:00',end:'08:00'}]}),/end must be after start/);
  assert.throws(()=>buildCleaningOnboardingSetup({...base(),team_capacity:{default_crew_size:4,max_parallel_crews:2,max_workers_per_crew:3}}),/cannot exceed/);
});

test('recurring setup requires selected recurring-capable service and valid default',()=>{
  assert.throws(()=>buildCleaningOnboardingSetup({...base(),offered_service_ids:['custom_cleaning_service'],recurring:{enabled:true,supported_frequencies:['weekly'],default_frequency:'weekly'}}),/no selected service supports recurrence/);
  assert.throws(()=>buildCleaningOnboardingSetup({...base(),recurring:{enabled:true,supported_frequencies:['weekly'],default_frequency:'fortnightly'}}),/default recurring frequency/);
});

test('legacy tenant aliases and cross-boundary substitutes fail closed',()=>{
  assert.throws(()=>buildCleaningOnboardingSetup({...base(),tenant_id:'legacy'}),/legacy tenant boundary/);
  assert.throws(()=>buildCleaningOnboardingSetup({...base(),company_id:''}),/company_id is required/);
});

test('retained onboarding authority remains the persistence owner',()=>{
  const setup=buildCleaningOnboardingSetup(base());
  assert.equal(setup.retained_onboarding_authority,'titan.onboarding.cleaning-service-setup-authority.v1');
  assert.equal(setup.retained_catalogue_copy_permitted,false);
  const payload=toRetainedCleaningServiceSetupPayload(setup);
  assert.equal(payload.requires_retained_onboarding_authority,true);
  assert.equal(payload.projection_only,true);
  assert.equal(payload.grants_authority,false);
  assert.equal(payload.execution_permitted,false);
});

test('equipment and supply defaults are cleaning configuration, not implicit capabilities',()=>{
  const setup=buildCleaningOnboardingSetup(base());
  assert.deepEqual(setup.equipment_defaults,['vacuum','mop']);
  assert.deepEqual(setup.supply_defaults,['microfibre','general cleaner']);
  assert.equal('capabilities' in setup,false);
});
