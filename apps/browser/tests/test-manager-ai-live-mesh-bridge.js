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
