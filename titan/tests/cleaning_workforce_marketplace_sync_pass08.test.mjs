import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../titan-cleaning-workforce.js',import.meta.url),'utf8');
const a={id:'titan.cleaning.adv_a',name:'Adversarial A',department:'work',purpose:'a',capabilities:['a']};
const dupId={id:a.id,name:'Duplicate Id',department:'work',purpose:'dup id',capabilities:['b']};
const dupName={id:'titan.cleaning.adv_dup_name',name:'  adversarial   a  ',department:'work',purpose:'dup name',capabilities:['c']};
const b={id:'titan.cleaning.adv_b',name:'Adversarial B',department:'work',purpose:'b',capabilities:['d']};
const cross={id:'titan.cleaning.adv_cross',name:'Cross Company',department:'work',purpose:'cross',capabilities:['e']};
const legacy={id:'titan.cleaning.adv_legacy',name:'Legacy Boundary',department:'work',purpose:'legacy',capabilities:['f']};
let persisted={
  titanBusinessProfile:{company_id:'company-a'},
  titanCleaningWorkforceMarketplaceV1:{
    'company-a':{company_id:'company-a',products:{
      [a.id]:{status:'installed'},
      [b.id]:{status:'purchased'},
      [cross.id]:{status:'installed',company_id:'company-b'},
      [legacy.id]:{status:'installed',tenant_id:'legacy-company'}
    }}
  }
};
const listeners=[];
const context={window:{TitanCleaningWorkforceProducts:{products:[null,a,dupId,dupName,b,cross,legacy,42]}},globalThis:null,console,setTimeout,clearTimeout,
  chrome:{storage:{local:{async get(keys){const out={}; for(const key of keys) out[key]=persisted[key]; return out;},async set(value){Object.assign(persisted,value);}},onChanged:{addListener(fn){listeners.push(fn);}}}}};
context.globalThis=context; vm.createContext(context); vm.runInContext(source,context);
const wf=context.window.TitanCleaningWorkforce;

await Promise.all(Array.from({length:8},()=>wf.syncMarketplaceSpecialists()));
assert.deepEqual(Array.from(wf.specialists).filter(x=>x.marketplace).map(x=>x.id),[a.id,b.id],'malformed/duplicate/cross-company records must not disturb deterministic valid roster');
assert.equal(wf.byId[dupName.id],undefined,'duplicate normalized name rejected');
assert.equal(wf.byId[cross.id],undefined,'per-product cross-company lifecycle rejected');
assert.equal(wf.byId[legacy.id],undefined,'per-product legacy company alias rejected');
assert.equal(wf.specialists.filter(x=>x.id===a.id).length,1,'duplicate product id must not duplicate roster entry');

// stale/uninstalled lifecycle removes prior projected worker deterministically.
persisted.titanCleaningWorkforceMarketplaceV1['company-a'].products[a.id].status='uninstalled';
persisted.titanCleaningWorkforceMarketplaceV1['company-a'].products[b.id].status='available';
const removal=await wf.syncMarketplaceSpecialists();
assert.equal(removal.removed,2);
assert.equal(wf.byId[a.id],undefined);
assert.equal(wf.byId[b.id],undefined);

// malformed state must fail closed and preserve built-ins without resurrecting stale workers.
persisted.titanCleaningWorkforceMarketplaceV1['company-a'].products=null;
const malformed=await wf.syncMarketplaceSpecialists();
assert.equal(wf.byId[a.id],undefined);
assert.ok(wf.byId['titan.cleaning.scope_assessor']);
assert.equal(malformed.error,undefined);

// restore valid state and exercise storage-event repetition.
persisted.titanCleaningWorkforceMarketplaceV1['company-a'].products={[a.id]:{status:'installed'}};
for(let i=0;i<5;i++) for(const listener of listeners) listener({titanCleaningWorkforceMarketplaceV1:{newValue:persisted.titanCleaningWorkforceMarketplaceV1}},'local');
await new Promise(resolve=>setTimeout(resolve,20));
assert.equal(wf.specialists.filter(x=>x.id===a.id).length,1,'repeated storage events must remain idempotent');
assert.equal(wf.byId[a.id].company_id,'company-a');

console.log('PASS pass08 adversarial marketplace reconciliation');
