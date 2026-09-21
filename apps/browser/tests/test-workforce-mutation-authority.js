const assert=require('assert');
const {load}=require('./_workforce-test-loader'); const g=load();
g.CodeeWorkforceHostIntegration.register({});
const direct=g.CodeeWorkforceHostIntegration.callCapability('workforce.tool.request',{managerId:'repository-manager',capability:'repository.host.write',args:{path:'README.md',content:'x'}},{});
assert.strictEqual(direct.forbidden,true,'manager direct write tool must be forbidden');
(async()=>{
  const denied=await g.CodeeWorkforceHostIntegration.executeToolRequest({capability:'repository.host.command',args:{command:'rm -rf x'}},{});
  assert.strictEqual(denied.forbidden,true);
  let called=null;
  g.CodeeRepositoryHostIntegration={callCapability:async(cap,payload)=>{called={cap,payload}; return {ok:true,backup:{id:'b1',verified:true},audit:{id:'a1'},rollback:{available:true}};}};
  const res=await g.CodeeWorkforceHostIntegration.routeGovernedMutation({managerId:'repository-manager',action:'repository.write',target:'README.md',change:{content:'safe content'},reason:'approved change'},{});
  assert.strictEqual(res.ok,true);
  assert.strictEqual(called.cap,'repository.host.write');
  assert.strictEqual(called.payload.path,'README.md');
  assert.strictEqual(called.payload.content,'safe content');
  assert(!JSON.stringify(called.payload.meta).includes('safe content'));
  console.log('Workforce mutation authority/backup-route boundary OK');
})().catch(e=>{console.error(e);process.exit(1)});
