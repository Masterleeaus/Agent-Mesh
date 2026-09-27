import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveCommercialState,normalizeMarketplaceCompanyId,createMarketplaceCommercialLifecycle}
  from '../.test-dist/ported/marketplace-commercial-lifecycle.js';

test('rejects legacy tenant boundaries',()=>assert.throws(()=>normalizeMarketplaceCompanyId({tenant_company_id:'x'}),/company_id/));
test('legacy installed state is observational until package verification exists',()=>{
  const x=deriveCommercialState({kind:'growth',id:'reviews',legacyState:{status:'installed'}});
  assert.equal(x.lifecycle,'installed_unverified_legacy'); assert.equal(x.needs_governed_reconciliation,true);
  assert.equal(x.authority.grants_authority,false);
});
test('verified installs identify governed runtime as install authority',()=>{
  const x=deriveCommercialState({kind:'module',id:'reviews',legacyState:{status:'installed'},packageVerification:{verified:true}});
  assert.equal(x.lifecycle,'installed_verified'); assert.equal(x.source_of_install_authority,'titan_modules_governed_runtime');
});
test('governed install requires explicit approval',async()=>{
  const api=createMarketplaceCommercialLifecycle({
    moduleManager:{listStates:async()=>({})},
    marketplaceRuntime:{install:async()=>({ok:true})},
    readLegacyState:async()=>({}),readEvidence:async()=>({})
  });
  await assert.rejects(()=>api.governedInstall('company-1','reviews'),/approved=true/);
  const y=await api.governedInstall('company-1','reviews',{approved:true});
  assert.equal(y.company_id,'company-1');
});
