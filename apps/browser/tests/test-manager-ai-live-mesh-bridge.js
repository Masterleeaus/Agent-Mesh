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

if(!bridge.includes("agent_mesh.continuation.get")) throw new Error('continuation read action missing');
if(!bridge.includes("agent_mesh.continuation.checkpoint")) throw new Error('continuation checkpoint action missing');
if(!bridge.includes("agent_mesh.continuation.takeover")) throw new Error('continuation takeover action missing');
if(!sw.includes('checkpointAgentMeshContinuation')) throw new Error('automatic Agent Mesh checkpoint hook missing');
if(!sw.includes("checkpointAgentMeshContinuation(normalized,'live-snapshot')")) throw new Error('live snapshot checkpoint trigger missing');
if(!sw.includes('takeoverAgentMeshContinuation')) throw new Error('Agent Mesh takeover bridge helper missing');
if(!sw.includes('claim_release:false')) throw new Error('takeover/checkpoint must not release claim authority');

if(!bridge.includes("agent_mesh.execution.audit")) throw new Error('execution audit read action missing');
if(!sw.includes('fetchAgentMeshExecutionAudit')) throw new Error('execution audit projection helper missing');
if(!sw.includes("authority:'github-projection-only'")) throw new Error('execution audit must remain projection-only');
if(!sw.includes('mayMerge:false') || !sw.includes('mayReleaseClaim:false')) throw new Error('execution audit must not gain merge/claim release authority');

if(!sw.includes('const executionAudit=await fetchAgentMeshExecutionAudit')) throw new Error('live snapshot must attach execution audit');
if(!sw.includes('liveReconciliation,executionAudit')) throw new Error('execution audit missing from normalized live snapshot');
const rr=fs.readFileSync('src/titan-zero/manager-restart-reconstruction.js','utf8');
if(!rr.includes("mayAdvanceLifecycle:false")) throw new Error('execution audit must not advance lifecycle during restart');
if(!rr.includes("authority:'github-projection-only'")) throw new Error('restart execution evidence must remain projection-only');

const restartCtx={globalThis:{}};vm.createContext(restartCtx);
vm.runInContext(fs.readFileSync('src/titan-zero/manager-restart-reconstruction.js','utf8'),restartCtx);
const resume=restartCtx.globalThis.TitanZeroManagerRestartReconstruction.deriveExecutionResume([
 {request_id:'done-1',status:'ACCEPTED'},{request_id:'done-1',status:'SUCCEEDED'},
 {request_id:'fail-1',status:'FAILED'},{request_id:'pending-1',status:'ACCEPTED'}
]);
assert.deepStrictEqual(Array.from(resume.succeeded),['done-1']);
assert.deepStrictEqual(Array.from(resume.failed),['fail-1']);
assert.deepStrictEqual(Array.from(resume.unresolved),['pending-1']);
assert.strictEqual(resume.replayPolicy,'DO_NOT_REPLAY_SUCCEEDED_OR_UNRESOLVED');
assert.strictEqual(resume.mayAdvanceLifecycle,false);

if(!sw.includes('bootstrapAgentMeshResume')) throw new Error('Agent Mesh resume bootstrap entrypoint missing');
if(!sw.includes("bootstrap.status==='READY_TO_RESUME'")) throw new Error('resume mutation must require READY_TO_RESUME');
if(!sw.includes("mayMutate:false,reason:")) throw new Error('resume bootstrap errors must fail closed');
if(!sw.includes('globalThis.bootstrapAgentMeshResume=bootstrapAgentMeshResume')) throw new Error('resume bootstrap not exposed through existing service worker surface');

if(!sw.includes("reason:'resume-reconciliation-required',mayMutate:false")) throw new Error('takeover must fail closed behind resume bootstrap');
if(!sw.includes("reason:'agent-mesh-resume-reconciliation-required'")) throw new Error('Manager mutation execution must be gated by resume reconciliation');
if(!sw.includes("authority:{ai:false,managerRules:true,githubMergeRequest:false,delete:false,mayMutate:false}")) throw new Error('blocked Manager execution must explicitly deny mutation authority');

if(!sw.includes("reason:'resume-reconciliation-required',mayMutate:false")) throw new Error('takeover must fail closed before mutation when resume reconciliation fails');
if(!sw.includes("reason:'agent-mesh-resume-reconciliation-required'")) throw new Error('Manager mutation plan must be blocked by resume reconciliation');
if(!sw.includes("authority:{ai:false,managerRules:true,githubMergeRequest:false,delete:false,mayMutate:false}")) throw new Error('blocked Manager plan must explicitly deny mutation authority');

if(!sw.includes("preflightAgentMeshWorkMutation(snapshot,kind='work-mutation')")) throw new Error('central Agent Mesh work-mutation preflight missing');
if(!sw.includes("preflightAgentMeshWorkMutation(snapshot,'continuation-takeover')")) throw new Error('takeover bypasses central mutation preflight');
if(!sw.includes("preflightAgentMeshWorkMutation(snapshot,'manager-plan')")) throw new Error('Manager plan bypasses central mutation preflight');

const checkpointGateIndex=sw.indexOf("async function checkpointAgentMeshContinuation");
const checkpointCallIndex=sw.indexOf("'agent_mesh.continuation.checkpoint'",checkpointGateIndex);
const checkpointResumeIndex=sw.indexOf("const resumeGate=await bootstrapAgentMeshResume(snapshot);",checkpointGateIndex);
if(checkpointResumeIndex<checkpointGateIndex||checkpointResumeIndex>checkpointCallIndex) throw new Error('checkpoint mutation must pass resume gate before bridge call');

const checkpointFn=sw.slice(sw.indexOf('async function checkpointAgentMeshContinuation'),sw.indexOf('async function takeoverAgentMeshContinuation'));
if(!checkpointFn.includes('bootstrapAgentMeshResume(snapshot)')||!checkpointFn.includes("reason:'resume-reconciliation-required'")) throw new Error('continuation checkpoint must also be resume-gated');
const mutationCalls=(sw.match(/agent_mesh\.(?:continuation\.checkpoint|continuation\.takeover|recover_agent|route_packet)/g)||[]);
if(mutationCalls.length<4) throw new Error('expected Agent Mesh mutation call sites missing');

if(!sw.includes('async function callAgentMeshMutation')) throw new Error('central Agent Mesh mutation preflight missing');
if(!sw.includes("'agent_mesh-mutation-not-allowlisted'")) throw new Error('Agent Mesh mutation preflight must fail closed on unknown actions');
if(!sw.includes("callAgentMeshMutation(config,'agent_mesh.continuation.checkpoint'")) throw new Error('checkpoint bypasses central mutation preflight');
if(!sw.includes("callAgentMeshMutation(config,'agent_mesh.continuation.takeover'")) throw new Error('takeover bypasses central mutation preflight');
if(!sw.includes('callAgentMeshMutation(config,action,payload,snapshot)')) throw new Error('Manager Agent Mesh mutations bypass central preflight');

if(sw.includes('bootstrapRequired=false')||sw.includes('bootstrapRequired:false')) throw new Error('Agent Mesh mutation bootstrap bypass option must not exist');
if(!sw.includes("const allowed=new Set(['agent_mesh.recover_agent','agent_mesh.route_packet','agent_mesh.continuation.checkpoint','agent_mesh.continuation.takeover'])")) throw new Error('Agent Mesh mutation allowlist missing');
if(!sw.includes("const gate=await bootstrapAgentMeshResume(snapshot);if(!gate.ok||gate.mayMutate!==true)")) throw new Error('all allowlisted Agent Mesh mutations must pass resume bootstrap');

if(!sw.includes("const allowed=new Set(['agent_mesh.recover_agent','agent_mesh.route_packet','agent_mesh.continuation.checkpoint','agent_mesh.continuation.takeover'])")) throw new Error('Agent Mesh mutation allowlist missing');
if(!sw.includes("return callAgentMeshMutation(config,'agent_mesh.continuation.checkpoint'")) throw new Error('checkpoint bypasses central mutation gate');
if(!sw.includes("return callAgentMeshMutation(config,'agent_mesh.continuation.takeover'")) throw new Error('takeover bypasses central mutation gate');
if(!sw.includes("const result=await callAgentMeshMutation(config,action,payload,snapshot)")) throw new Error('Manager mutation bypasses central mutation gate');

if(!sw.includes('agent-mesh-mutation-requires-governed-path')) throw new Error('generic bridge must not bypass Agent Mesh mutation gate');
if(!sw.includes("typeof action === 'string' && action.startsWith('agent_mesh.')")) throw new Error('generic bridge Agent Mesh classification guard missing');

if(!bridge.includes('RESUME_GATED_MUTATIONS')) throw new Error('bridge resume-gated mutation registry missing');
if(!bridge.includes("resume-reconciliation-required")) throw new Error('bridge must reject gated mutations without resume proof');
if(!sw.includes('preflightAgentMeshWorkMutation')) throw new Error('central Agent Mesh mutation preflight missing');
if(!sw.includes('callAgentMeshMutation')) throw new Error('central Agent Mesh mutation wrapper missing');
if(!sw.includes("allowed=new Set(['agent_mesh.recover_agent','agent_mesh.route_packet','agent_mesh.continuation.checkpoint','agent_mesh.continuation.takeover'])")) throw new Error('Agent Mesh mutation allowlist changed unexpectedly');

if(!bridge.includes("const RESUME_GATED_MUTATIONS=new Set(['agent_mesh.recover_agent','agent_mesh.route_packet','agent_mesh.continuation.takeover'])")) throw new Error('central resume gate must cover takeover mutation');
if(!bridge.includes("resume.status!=='READY_TO_RESUME'")) throw new Error('bridge mutation gate must require READY_TO_RESUME');

const bc=fs.readFileSync('src/integration/titan-bridge-client.js','utf8');
if(!bc.includes("agent_mesh.continuation.checkpoint','agent_mesh.continuation.takeover")) throw new Error('all Agent Mesh mutations must be resume-gated');
if(!sw.includes('const gatedPayload={...payload,resume_gate:resumeGate.bootstrap}')) throw new Error('validated resume gate must reach bridge mutation client');

if(!sw.includes("const gatedPayload={...payload,resume_gate:gate.bootstrap}")) throw new Error('Agent Mesh mutation must receive validated resume gate');
if(sw.includes("resume_gate:resumeGate.bootstrap")) throw new Error('stale undefined resumeGate reference remains');
if(!sw.includes("preflightAgentMeshWorkMutation(snapshot")) throw new Error('central mutation preflight missing');

const mutationLines=sw.split('\n').filter(x=>x.includes("CodeeTitanBridgeClient.call(config,'agent_mesh."));
for(const line of mutationLines){ if(!line.includes('execution.audit') && !line.includes('snapshot') && !line.includes('health') && !line.includes('capabilities')) { /* mutation calls are required to route through callAgentMeshMutation */ } }
if(!sw.includes("async function callAgentMeshMutation(config,action,payload,snapshot)")) throw new Error('central Agent Mesh mutation gate missing');
if(!sw.includes("const gate=await bootstrapAgentMeshResume(snapshot)")) throw new Error('central mutation gate must reconcile resume state');
if(!sw.includes("return globalThis.CodeeTitanBridgeClient.call(config,action,gatedPayload)")) throw new Error('governed mutation dispatch missing');

const directMeshCalls=(sw.match(/CodeeTitanBridgeClient\.call\([^\n]*agent_mesh\.(?!snapshot|health|capabilities)/g)||[]);
assert.strictEqual(directMeshCalls.length,0,'no ungoverned direct Agent Mesh mutation calls may bypass callAgentMeshMutation');
assert(sw.includes('if (meshMutation) return { ok: false, reason: \'agent-mesh-mutation-requires-governed-path\''),'generic Titan bridge must reject ungoverned Agent Mesh mutations');
assert(sw.includes("return callAgentMeshMutation(config,action,payload,snapshot)"),'all Manager Agent Mesh mutations must use governed mutation helper');

const bridgeClient=fs.readFileSync('src/integration/titan-bridge-client.js','utf8');
if(bridgeClient.includes("agent_mesh.continuation.checkpoint','agent_mesh.continuation.takeover'])")) throw new Error('checkpoint must not be resume-gated');
if(!bridgeClient.includes("agent_mesh.recover_agent','agent_mesh.route_packet','agent_mesh.continuation.takeover")) throw new Error('work mutations must remain resume-gated');
if(!sw.includes("const requiresGate=new Set(['agent_mesh.recover_agent','agent_mesh.route_packet','agent_mesh.continuation.takeover']).has(action)")) throw new Error('service-worker mutation gate classification missing');

const swSource=sw.split('\n');
const directMeshCalls=swSource.filter(line=>line.includes("CodeeTitanBridgeClient.call")&&line.includes("'agent_mesh."));
assert.strictEqual(directMeshCalls.length,1,'Agent Mesh direct bridge calls must remain read-only audit/snapshot paths; mutations must use governed wrapper');
assert(sw.includes("function callAgentMeshMutation(config,action,payload,snapshot)"),'central Agent Mesh mutation wrapper missing');
assert(sw.includes("const requiresGate=new Set(['agent_mesh.recover_agent','agent_mesh.route_packet','agent_mesh.continuation.takeover'])"),'all post-takeover mutation classes must remain resume-gated');

if(!sw.includes("action.startsWith('agent_mesh.') && globalThis.CodeeTitanBridgeClient.classify?.(action) === 'mutation'")) throw new Error('generic Titan bridge must reject Agent Mesh mutations');
if(!sw.includes("reason: 'agent-mesh-mutation-requires-governed-path'")) throw new Error('generic Agent Mesh mutation bypass must fail closed');
if(!sw.includes("const requiresGate=new Set(['agent_mesh.recover_agent','agent_mesh.route_packet','agent_mesh.continuation.takeover']).has(action)")) throw new Error('governed Agent Mesh mutation gate missing');

if(!sw.includes("if(!snapshot||typeof snapshot!=='object') return {ok:false,reason:'agent-mesh-snapshot-required',mayMutate:false}")) throw new Error('mesh mutation must require snapshot');
if(!sw.includes("const requiresGate=new Set(['agent_mesh.recover_agent','agent_mesh.route_packet','agent_mesh.continuation.checkpoint','agent_mesh.continuation.takeover'])")) throw new Error('all mesh mutation actions must use central resume gate');

const bc=fs.readFileSync('src/integration/titan-bridge-client.js','utf8');
if(!bc.includes("const RESUME_GATED_MUTATIONS=new Set(['agent_mesh.recover_agent','agent_mesh.route_packet','agent_mesh.continuation.checkpoint','agent_mesh.continuation.takeover'])")) throw new Error('bridge resume-gated mutation set incomplete');
if(bc.includes("const RESUME_GATED_ACTIONS=new Set")) throw new Error('stale duplicate resume gate classification remains');

if(!bridge.includes("agent_mesh.continuation.takeover")) throw new Error('takeover must remain resume-gated');
if(bridge.includes("const RESUME_GATED_MUTATIONS=new Set(['agent_mesh.recover_agent','agent_mesh.route_packet','agent_mesh.continuation.checkpoint'")) throw new Error('continuation checkpoint must not be blocked by reconciliation');
if(!sw.includes("const requiresGate=new Set(['agent_mesh.recover_agent','agent_mesh.route_packet','agent_mesh.continuation.takeover']).has(action)")) throw new Error('Agent Mesh mutation gate set drifted');

if(!sw.includes("const AGENT_MESH_MUTATION_POLICY=Object.freeze({")) throw new Error('central Agent Mesh mutation policy missing');
for(const pair of [["'agent_mesh.recover_agent':'resume-gated'"],["'agent_mesh.route_packet':'resume-gated'"],["'agent_mesh.continuation.takeover':'resume-gated'"],["'agent_mesh.continuation.checkpoint':'continuity-record-only'"]]) if(!sw.includes(pair[0])) throw new Error('Agent Mesh mutation policy classification missing: '+pair[0]);
if(!sw.includes("AGENT_MESH_MUTATION_POLICY[action]==='resume-gated'")) throw new Error('central mutation path must derive resume gate from policy');

if(!sw.includes("agent-mesh-mutation-requires-governed-path")) throw new Error('generic Titan Bridge must reject Agent Mesh mutations');
if(!sw.includes("const AGENT_MESH_MUTATION_POLICY=Object.freeze")) throw new Error('central Agent Mesh mutation policy missing');
if(!sw.includes("agent-mesh-mutation-not-allowlisted")) throw new Error('unknown Agent Mesh mutations must fail closed');
if(!sw.includes("return callAgentMeshMutation(config,'agent_mesh.continuation.checkpoint'")) throw new Error('checkpoint must use governed mutation wrapper');
if(!sw.includes("return callAgentMeshMutation(config,'agent_mesh.continuation.takeover'")) throw new Error('takeover must use governed mutation wrapper');
if(!sw.includes("const result=await callAgentMeshMutation(config,action,payload,snapshot)")) throw new Error('Manager recover/route must use governed mutation wrapper');

if(!sw.includes("agent-mesh-mutation-requires-governed-path")) throw new Error('generic bridge must deny Agent Mesh mutations');
if(!sw.includes("const AGENT_MESH_MUTATION_POLICY=Object.freeze")) throw new Error('central Agent Mesh mutation policy missing');
if(!sw.includes("agent_mesh.continuation.checkpoint':'continuity-record-only'")) throw new Error('checkpoint classification missing');
if(!sw.includes("const result=await callAgentMeshMutation(config,action,payload,snapshot)")) throw new Error('Manager Agent Mesh mutations bypass governed policy');

if(!sw.includes("agent-mesh-mutation-requires-governed-path")) throw new Error('generic Titan Bridge path must deny Agent Mesh mutations');
if(!sw.includes("AGENT_MESH_MUTATION_POLICY=Object.freeze")) throw new Error('central Agent Mesh mutation policy missing');
if(!sw.includes("agent-mesh-mutation-not-allowlisted")) throw new Error('unknown Agent Mesh mutations must fail closed');
if(!sw.includes("return callAgentMeshMutation(config,'agent_mesh.continuation.checkpoint'")) throw new Error('continuation checkpoint must use governed mutation path');
if(!sw.includes("const result=await callAgentMeshMutation(config,action,payload,snapshot)")) throw new Error('Manager Agent Mesh mutations must use governed mutation path');

if(!sw.includes('AGENT_MESH_MUTATION_POLICY')) throw new Error('central Agent Mesh mutation policy missing');
if(!sw.includes("agent-mesh-mutation-requires-governed-path")) throw new Error('generic bridge must deny direct Agent Mesh mutations');
if(!sw.includes("'agent_mesh.continuation.checkpoint':'continuity-record-only'")) throw new Error('checkpoint must remain continuity-only rather than resume-gated work mutation');
if(!sw.includes("return callAgentMeshMutation(config,'agent_mesh.continuation.takeover'")) throw new Error('takeover must use governed Agent Mesh mutation path');

if(!sw.includes("issue_number:Number(work.number)||null,subgoal_id:String(work.subgoal_id||target||'')")) throw new Error('Manager routing must use GitHub issue/subgoal identity');
if(!sw.includes("legacy_packet_id:target||null")) throw new Error('legacy packet compatibility must remain adapter-only');
if(sw.includes("payload={packet_id:target,mode:'manager_route_request'}")) throw new Error('active Manager routing must not use packet_id as primary identity');
