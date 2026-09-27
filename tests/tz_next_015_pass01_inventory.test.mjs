import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const inv=JSON.parse(fs.readFileSync(path.join(root,'titan-onboarding/inventory/merge42-onboarding-inventory.json'),'utf8'));
test('Pass01 inventory is bound to Manager Merge42 and company_id only',()=>{
  assert.equal(inv.manager_baseline.merge,42);
  assert.equal(inv.safety_contracts.company_boundary,'company_id only');
  assert.equal(inv.safety_contracts.identity_not_authority,true);
  assert.equal(inv.safety_contracts.automatic_authority_change,false);
});
test('Pass01 does not invent an onboarding runtime',()=>{
  assert.equal(inv.finding.operational_owner_onboarding_runtime_present,false);
  assert.equal(inv.finding.onboarding_named_file_count,24);
});
test('Pass01 records canonical reuse authorities',()=>{
  assert.ok(inv.reuse_authorities.company_boundary.files.includes('titan-runtime/authority/company-boundary.mjs'));
  assert.ok(inv.reuse_authorities.business_state_and_storage.files.includes('titan-local/storage/business-database.mjs'));
  assert.equal(inv.reuse_authorities.business_service_ownership.file,'titan-business-services/canonical-service-owners.json');
});
test('Pass01 identifies donor onboarding templates without promoting them',()=>{
  const t=inv.existing_onboarding_assets.templates;
  assert.ok(t.includes('titan-builder/pagestudio-donor/templates/customer-onboarding.json'));
  assert.ok(t.includes('titan-builder/pagestudio-donor/templates/property-onboarding.json'));
  assert.ok(t.includes('titan-builder/pagestudio-donor/templates/staff-onboarding.json'));
});
