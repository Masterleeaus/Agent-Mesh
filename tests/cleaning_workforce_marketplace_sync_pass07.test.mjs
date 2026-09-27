import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../titan-cleaning-workforce.js',import.meta.url),'utf8');
const product={
  id:'titan.cleaning.authority_probe',
  name:'Authority Probe Specialist',
  department:'work',
  purpose:'authority-neutral marketplace projection test',
  capabilities:['inspect','plan'],
  risk_ceiling:'MEDIUM',
  approval_required_for:['consequential_action']
};
const persisted={
  titanBusinessProfile:{company_id:'company-a'},
  titanCleaningWorkforceMarketplaceV1:{
    'company-a':{company_id:'company-a',products:{[product.id]:{status:'installed'}}}
  }
};
const local={
  async get(keys){ const out={}; for(const key of keys) out[key]=persisted[key]; return out; },
  async set(value){ Object.assign(persisted,value); }
};
const context={
  window:{TitanCleaningWorkforceProducts:{products:[product]}},
  globalThis:null,
  console,
  setTimeout,
  clearTimeout,
  chrome:{storage:{local,onChanged:{addListener(){}}}}
};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(source,context);
const workforce=context.window.TitanCleaningWorkforce;
await workforce.syncMarketplaceSpecialists();
const worker=workforce.byId[product.id];
assert.ok(worker,'installed marketplace specialist should project into roster');
assert.equal(worker.company_id,'company-a','company_id must remain the sole company boundary');
assert.equal(worker.companyBoundary,'company_id');
assert.equal(worker.company_boundary,'company_id');
for(const key of [
  'activationConfersAuthority','activation_confers_authority',
  'purchaseConfersAuthority','purchase_confers_authority',
  'installationConfersAuthority','installation_confers_authority',
  'marketplaceStatusConfersAuthority','marketplace_status_confers_authority',
  'identityConfersAuthority','identity_confers_authority',
  'rosterPresenceConfersAuthority','roster_presence_confers_authority',
  'grantsAuthority','grants_authority'
]) assert.equal(worker[key],false,`${key} must remain false`);

assert.equal(worker.marketplace,true,'roster metadata may identify marketplace origin');
assert.equal(worker.marketplace_status,'installed','lifecycle state may be visible without conferring authority');
assert.deepEqual(Array.from(worker.approvalRequiredFor),['consequential_action'],'product approval requirements must be preserved');
const contract=workforce.executionContract(worker,'Send a customer refund and mark the cleaning job complete.');
assert.match(contract,/Do not claim a customer message, booking, purchase, refund, invoice or other mutation occurred without an authoritative execution result\/receipt\./);
assert.match(contract,/Escalate hazards, uncertain chemical use, damage, access problems and approval-required changes\./);
assert.doesNotMatch(contract,/marketplace.*grants authority/i);

persisted.titanCleaningWorkforceMarketplaceV1['company-a'].products[product.id].status='purchased';
await workforce.syncMarketplaceSpecialists();
assert.equal(workforce.byId[product.id],worker,'lifecycle status update should not replace same-company roster identity');
assert.equal(worker.marketplace_status,'purchased');
for(const key of ['purchaseConfersAuthority','installationConfersAuthority','marketplaceStatusConfersAuthority','identityConfersAuthority','rosterPresenceConfersAuthority','grantsAuthority']) {
  assert.equal(worker[key],false,`${key} must remain false after lifecycle transition`);
}

console.log('PASS pass07 marketplace lifecycle/identity/roster authority neutrality');
