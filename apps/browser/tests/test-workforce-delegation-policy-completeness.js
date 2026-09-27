const assert=require('assert');const {load}=require('./_workforce-test-loader');const g=load();
for(const action of ['plan.advance','plan.complete','plan.skip','repository.write','repository.host.write','repository.host.delete','repository.host.command','server.settings.update','database.write','database.update','database.delete','database.insert','database.execute']){
 let blocked=false;try{g.CodeeDelegationPolicy.authorize({action})}catch{blocked=true}assert(blocked,`${action} must be forbidden to direct manager execution`);
}
assert.strictEqual(g.CodeeDelegationPolicy.authorize({action:'repository.search'}).allowed,true);
console.log('workforce delegation policy completeness OK');
