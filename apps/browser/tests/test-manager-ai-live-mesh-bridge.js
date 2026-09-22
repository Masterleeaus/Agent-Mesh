const fs=require('fs');
const bridge=fs.readFileSync('src/integration/titan-bridge-client.js','utf8');
const sw=fs.readFileSync('src/lib/service-worker.js','utf8');
if(!bridge.includes("agent_mesh.snapshot")) throw new Error('live snapshot action missing');
if(!bridge.includes("agent_mesh.recover_agent")) throw new Error('recovery action missing');
if(!sw.includes('fetchLiveManagerAISnapshot')) throw new Error('live manager snapshot bridge missing');
if(!sw.includes('executeManagerAIPlan')) throw new Error('manager execution loop missing');
if(!sw.includes('EXECUTE_MANAGER_AI_PLAN')) throw new Error('execution message missing');
if(!sw.includes('canonicalPromotion:false')) throw new Error('manager execution must not gain canonical promotion authority');
console.log('PASS test-manager-ai-live-mesh-bridge');

if(!sw.includes("titan-code.manager-snapshot.v3")) throw new Error('GitHub-aware manager snapshot v3 missing');
if(!sw.includes('githubProjection')) throw new Error('GitHub lifecycle projection missing from live snapshot');
if(!sw.includes('liveReconciliation')) throw new Error('GitHub live reconciliation missing from live snapshot');
if(!sw.includes('TitanCodeManagerGitHubState.derive')) throw new Error('canonical GitHub state projector not reused');

const vm=require('vm'),assert=require('assert');
const ctx={globalThis:{}};vm.createContext(ctx);
for(const file of ['manager-github-state.js','manager-live-state.js']) vm.runInContext(fs.readFileSync('src/titan-zero/'+file,'utf8'),ctx);
const L=ctx.globalThis.TitanZeroManagerLiveState,a='a'.repeat(40);
let live=L.reconcile({github:{issue:{number:734,subgoal_id:'TZ-ROADMAP-55-SG-01',state:'OPEN'},mainSha:a,baseSha:a,headSha:a,claim:{branch:'agent/TZ-ROADMAP-55-SG-01',exists:true}}});
assert.strictEqual(live.status,'CONSISTENT');assert.strictEqual(live.lifecycle,'CLAIMED');assert.strictEqual(live.authority.aiMaySet,false);
live=L.reconcile({github:{issue:{number:734,subgoal_id:'TZ-ROADMAP-55-SG-01',state:'OPEN'},mainSha:a,baseSha:a,headSha:a,claim:{branch:'agent/WRONG',exists:true}}});
assert.strictEqual(live.status,'STATE_DRIFT_DETECTED');assert.strictEqual(live.failClosed,true);assert(live.drift.includes('claim-branch-noncanonical'));
live=L.reconcile({github:{issue:{number:734,subgoal_id:'TZ-ROADMAP-55-SG-01',state:'OPEN'},mainSha:'bad'}});
assert.strictEqual(live.status,'STATE_DRIFT_DETECTED');assert(live.drift.includes('invalid-github-state-evidence'));
