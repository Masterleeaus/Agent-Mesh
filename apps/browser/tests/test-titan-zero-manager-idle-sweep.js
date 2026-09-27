const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..'),s={console,globalThis:{}};s.globalThis=s;vm.createContext(s);
for(const f of ['manager-workspace-ledger','manager-self-claim','manager-idle-sweep'])vm.runInContext(fs.readFileSync(path.join(root,'src/titan-zero',f+'.js'),'utf8'),s,{filename:f});
const Idle=s.TitanZeroManagerIdleSweep,mainSha='a'.repeat(40);
assert.throws(()=>Idle.sweep(),/LOCAL_IDLE_SWEEP_FORBIDDEN/);
const plan=Idle.plan({mainSha,workItems:[{subgoal_id:'TZ-MAINT-01',priority:'P0',lifecycle:'AVAILABLE'}],agents:[{id:'agent-3',state:'AVAILABLE',execution_active:false}]},{mainSha});
assert.equal(plan.mutatesLocalState,false);assert.equal(plan.assignments.length,1);assert.equal(plan.assignments[0].status,'CANDIDATE_ONLY');assert.equal(plan.assignments[0].claim_request.operation,'CREATE_GITHUB_REF_ATOMICALLY');assert.equal(plan.assignments[0].claim_request.expected_absent,true);assert.equal(plan.authority.lifecycleAdvance,false);
console.log('PASS test-titan-zero-manager-idle-sweep');
