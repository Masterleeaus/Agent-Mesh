import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../titan-cleaning-workforce.js',import.meta.url),'utf8');
const a={id:'titan.cleaning.market_a',name:'Marketplace A',department:'work',purpose:'a',capabilities:['a','b','c','d']};
const b={id:'titan.cleaning.market_b',name:'Marketplace B',department:'work',purpose:'b',capabilities:['a','b','c','d']};
const sameName={id:'titan.cleaning.market_same_name',name:'Marketplace A',department:'work',purpose:'dup',capabilities:['a','b','c','d']};
let storage={
  titanBusinessProfile:{company_id:'company-a'},
  titanCleaningWorkforceMarketplaceV1:{
    'company-a':{company_id:'company-a',products:{[a.id]:{status:'purchased'},[b.id]:{status:'installed'},[sameName.id]:{status:'purchased'}}},
    'company-b':{company_id:'company-b',products:{[a.id]:{status:'installed'}}}
  }
};
const context={
  window:{TitanCleaningWorkforceProducts:{products:[b,a,sameName]}},globalThis:null,console,
  chrome:{storage:{local:{
    async get(keys){const out={}; for(const k of keys) out[k]=storage[k]; return out;},
    async set(value){storage={...storage,...value};}
  }}}
};
context.globalThis=context; vm.createContext(context); vm.runInContext(source,context);
const workforce=context.window.TitanCleaningWorkforce;

await workforce.syncMarketplaceSpecialists();
assert.deepEqual([...workforce.specialists].filter(x=>x.marketplace).map(x=>x.id),[b.id,a.id],'marketplace roster must follow canonical product order');
assert.equal(workforce.byId[sameName.id],undefined,'duplicate normalized marketplace names must be suppressed');
const aObject=workforce.byId[a.id];
const bObject=workforce.byId[b.id];

const replay=await workforce.syncMarketplaceSpecialists();
assert.equal(replay.added,0);
assert.equal(replay.removed,0);
assert.equal(workforce.byId[a.id],aObject,'same-company replay should preserve marketplace worker identity');
assert.equal(workforce.byId[b.id],bObject,'same-company replay should preserve marketplace worker identity');
assert.deepEqual([...workforce.specialists].filter(x=>x.marketplace).map(x=>x.id),[b.id,a.id]);

storage.titanCleaningWorkforceMarketplaceV1['company-a'].products[b.id].status='available';
const removal=await workforce.syncMarketplaceSpecialists();
assert.equal(removal.removed,1);
assert.equal(workforce.byId[b.id],undefined);
assert.ok(workforce.byId[a.id]);

storage.titanBusinessProfile={company_id:'company-b'};
const switched=await workforce.syncMarketplaceSpecialists();
assert.equal(switched.removed,1,'old-company marketplace worker must be evicted before same-id replacement');
assert.equal(switched.added,1,'same product id for new company must be re-materialized with new company scope');
assert.equal(workforce.byId[a.id].company_id,'company-b');
assert.notEqual(workforce.byId[a.id],aObject,'cross-company switch must not retain prior company object');
assert.equal(workforce.byId['titan.cleaning.scope_assessor'].marketplace,undefined,'built-in roles must remain untouched');

console.log('PASS pass05 deterministic marketplace reconciliation');
