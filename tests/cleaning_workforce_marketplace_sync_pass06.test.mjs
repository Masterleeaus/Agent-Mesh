import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../titan-cleaning-workforce.js',import.meta.url),'utf8');
const product={id:'titan.cleaning.restart_specialist',name:'Restart Specialist',department:'work',purpose:'restart/offline test',capabilities:['a','b','c','d']};
const store={
  titanBusinessProfile:{company_id:'company-a'},
  titanCleaningWorkforceMarketplaceV1:{
    'company-a':{company_id:'company-a',products:{[product.id]:{status:'installed'}}}
  }
};
const persisted={...store};
const writes=[];

function boot(){
  const listeners=[];
  const local={
    async get(keys){
      await new Promise(resolve=>setTimeout(resolve,1));
      const out={}; for(const key of keys) out[key]=persisted[key]; return out;
    },
    async set(value){ writes.push(value); Object.assign(persisted,value); }
  };
  const context={window:{TitanCleaningWorkforceProducts:{products:[product]}},globalThis:null,console,setTimeout,clearTimeout,
    chrome:{storage:{local,onChanged:{addListener(fn){listeners.push(fn);}}}}};
  context.globalThis=context;
  vm.createContext(context); vm.runInContext(source,context);
  return {workforce:context.window.TitanCleaningWorkforce,listeners};
}

const first=boot();
await Promise.all([first.workforce.syncMarketplaceSpecialists(),first.workforce.syncMarketplaceSpecialists(),first.workforce.syncMarketplaceSpecialists()]);
assert.equal(first.workforce.specialists.filter(x=>x.id===product.id).length,1,'concurrent rehydration must remain idempotent');
assert.equal(first.workforce.byId[product.id].company_id,'company-a');

const second=boot();
await second.workforce.syncMarketplaceSpecialists();
assert.equal(second.workforce.specialists.filter(x=>x.id===product.id).length,1,'fresh restart must rehydrate installed specialist from existing local state');
assert.notEqual(second.workforce.byId[product.id],first.workforce.byId[product.id],'restart must reconstruct in-memory projection, not persist worker object');

persisted.titanCleaningWorkforceMarketplaceV1={
  'company-a':{company_id:'company-a',products:{[product.id]:{status:'available'}}}
};
for(const listener of second.listeners) listener({titanCleaningWorkforceMarketplaceV1:{newValue:persisted.titanCleaningWorkforceMarketplaceV1}},'local');
await new Promise(resolve=>setTimeout(resolve,10));
assert.equal(second.workforce.byId[product.id],undefined,'local marketplace state change must rehydrate and remove unavailable specialist');

const beforeIrrelevant=second.workforce.specialists.length;
for(const listener of second.listeners) listener({unrelatedKey:{newValue:true}},'local');
await new Promise(resolve=>setTimeout(resolve,5));
assert.equal(second.workforce.specialists.length,beforeIrrelevant,'unrelated local changes must not trigger roster mutation');

assert.ok(writes.length>=2,'startup metadata writes expected');
for(const write of writes){
  assert.equal(Object.prototype.hasOwnProperty.call(write,'titanCleaningWorkforceMarketplaceV1'),false,'workforce sync must never persist a parallel marketplace/roster store');
  assert.equal(Object.prototype.hasOwnProperty.call(write,'marketplaceSpecialists'),false,'workforce sync must never persist marketplace roster objects');
}
console.log('PASS pass06 restart/offline/idempotent marketplace rehydration');
