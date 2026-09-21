import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../titan-cleaning-workforce.js',import.meta.url),'utf8');
const optional={id:'titan.cleaning.market_test_specialist',name:'Marketplace Test Specialist',department:'work',purpose:'test',capabilities:['a','b','c','d'],risk_ceiling:'LOW'};
let state={
  titanBusinessProfile:{company_id:'company-a'},
  titanCleaningWorkforceMarketplaceV1:{
    'company-a':{company_id:'company-a',products:{[optional.id]:{status:'purchased'}}}
  }
};
const context={
  window:{TitanCleaningWorkforceProducts:{products:[optional]}},
  globalThis:null,
  chrome:{storage:{local:{
    async get(keys){const out={}; for(const k of keys) out[k]=state[k]; return out;},
    async set(value){state={...state,...value};}
  }}},
  console
};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(source,context);
await context.window.TitanCleaningWorkforce.syncMarketplaceSpecialists();
const workforce=context.window.TitanCleaningWorkforce;
assert.ok(workforce.byId[optional.id],'purchased marketplace specialist should join roster');
assert.equal(workforce.byId[optional.id].marketplace,true);
assert.equal(workforce.byId[optional.id].company_id,'company-a');
assert.equal(workforce.byId[optional.id].purchase_confers_authority,false);
assert.equal(workforce.byId[optional.id].installation_confers_authority,false);
const builtIn=workforce.byId['titan.cleaning.scope_assessor'];
assert.ok(builtIn,'built-in specialist must remain');
state.titanCleaningWorkforceMarketplaceV1['company-a'].products[optional.id].status='available';
await workforce.syncMarketplaceSpecialists();
assert.equal(workforce.byId[optional.id],undefined,'removed marketplace specialist should leave roster');
assert.equal(workforce.byId['titan.cleaning.scope_assessor'],builtIn,'built-in specialist must not be replaced');
console.log('PASS pass03 marketplace sync runtime projection');
