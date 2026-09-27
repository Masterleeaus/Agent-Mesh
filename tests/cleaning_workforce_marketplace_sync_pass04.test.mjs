import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../titan-cleaning-workforce.js',import.meta.url),'utf8');
const optional={id:'titan.cleaning.market_boundary_test',name:'Marketplace Boundary Test',department:'work',purpose:'test',capabilities:['a','b','c','d'],risk_ceiling:'LOW'};

async function boot(initialState){
  let state=structuredClone(initialState);
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
  return {workforce:context.window.TitanCleaningWorkforce,getState:()=>state};
}

const canonical=await boot({
  titanBusinessProfile:{company_id:'company-a'},
  titanCleaningWorkforceMarketplaceV1:{
    'company-a':{company_id:'company-a',products:{[optional.id]:{status:'installed'}}}
  }
});
let result=await canonical.workforce.syncMarketplaceSpecialists();
assert.ok(canonical.workforce.byId[optional.id],'canonical company_id lifecycle state should project installed specialist');
assert.equal(canonical.workforce.byId[optional.id].company_id,'company-a');
assert.equal(canonical.workforce.byId[optional.id].activation_confers_authority,false);
assert.equal(canonical.workforce.byId[optional.id].purchase_confers_authority,false);
assert.equal(canonical.workforce.byId[optional.id].installation_confers_authority,false);
assert.equal(result.reason,undefined);

for(const legacyKey of ['tenant_id','tenantId','tenant_company_id','business_id','businessId','account_id','accountId']){
  const profileLegacy=await boot({
    titanBusinessProfile:{company_id:'company-a',[legacyKey]:'legacy-company'},
    titanCleaningWorkforceMarketplaceV1:{
      'company-a':{company_id:'company-a',products:{[optional.id]:{status:'purchased'}}}
    }
  });
  result=await profileLegacy.workforce.syncMarketplaceSpecialists();
  assert.equal(result.reason,'legacy-company-boundary-rejected',`profile ${legacyKey} must fail closed`);
  assert.equal(profileLegacy.workforce.byId[optional.id],undefined,`profile ${legacyKey} must not project marketplace specialist`);

  const stateLegacy=await boot({
    titanBusinessProfile:{company_id:'company-a'},
    titanCleaningWorkforceMarketplaceV1:{
      'company-a':{company_id:'company-a',[legacyKey]:'legacy-company',products:{[optional.id]:{status:'installed'}}}
    }
  });
  result=await stateLegacy.workforce.syncMarketplaceSpecialists();
  assert.equal(result.reason,'company-state-unavailable',`state ${legacyKey} must fail closed`);
  assert.equal(stateLegacy.workforce.byId[optional.id],undefined,`state ${legacyKey} must not project marketplace specialist`);
}

const crossCompany=await boot({
  titanBusinessProfile:{company_id:'company-a'},
  titanCleaningWorkforceMarketplaceV1:{
    'company-a':{company_id:'company-b',products:{[optional.id]:{status:'purchased'}}}
  }
});
result=await crossCompany.workforce.syncMarketplaceSpecialists();
assert.equal(result.reason,'company-state-unavailable');
assert.equal(crossCompany.workforce.byId[optional.id],undefined,'cross-company state must not project specialist');
assert.ok(crossCompany.workforce.byId['titan.cleaning.scope_assessor'],'built-in specialist must remain after rejected state');

console.log('PASS pass04 marketplace lifecycle company-boundary hardening');
