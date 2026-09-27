const assert=require('assert'),fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..'),s={console};s.globalThis=s;vm.createContext(s);
const load=r=>vm.runInContext(fs.readFileSync(path.join(root,r),'utf8'),s,{filename:r});
['manager-lifecycle','manager-eligibility','manager-github-state','manager-live-state','manager-state-derivation','manager-dependency-engine','manager-queue-state','manager-restart-reconstruction'].forEach(n=>load(`src/titan-zero/${n}.js`));
const L=s.TitanZeroManagerLifecycle,S=s.TitanZeroManagerStateDerivation,D=s.TitanZeroManagerDependencyEngine,Q=s.TitanZeroManagerQueueState,R=s.TitanZeroManagerRestartReconstruction;
assert(L&&S&&D&&Q&&R);

assert.strictEqual(L.get({status:'DONE'}),'MERGED');assert.strictEqual(L.get({status:'PROMOTED'}),'MERGED');
assert.strictEqual(L.dependencySatisfied({status:'DONE'}),false);assert.strictEqual(L.dependencySatisfied({state:'MERGED'}),false);assert.strictEqual(L.dependencySatisfied({state:'MERGED',source:'github'}),true);

const packets=[{packet_id:'A',status:'DONE'},{packet_id:'B',status:'AVAILABLE',dependencies:['A'],priority:'P0'}];
const dep=D.derive(packets,{});assert.deepStrictEqual(Array.from(dep.completedPackets),[]);assert.strictEqual(dep.byPacket.B.eligible,false);
const legacyQ=Q.projectLegacy({packets:[{packet_id:'LEGACY',status:'AVAILABLE',priority:'P0'}],claims:[],dependencyState:{byPacket:{LEGACY:{eligible:true}}},convergencePending:['LEGACY']});
assert.strictEqual(legacyQ.nextGlobal,null);assert.deepStrictEqual(Array.from(legacyQ.eligible),[]);assert.strictEqual(legacyQ.authority.maySelectClaimCandidate,false);

const unavailable=S.derive({packets:[{packet_id:'LEGACY',status:'AVAILABLE'}]});assert.strictEqual(unavailable.source,'unavailable');assert.strictEqual(unavailable.failClosed,true);assert.strictEqual(unavailable.authority.mayClaim,false);
const compat=S.derive({compatibilityMode:true,packets:[{packet_id:'LEGACY',status:'AVAILABLE'}],claims:[],agents:[],deltas:[],handoffs:[],verification:[]});assert.strictEqual(compat.source,'legacy-projection');assert.strictEqual(compat.diagnosticOnly,true);assert.strictEqual(compat.queue.nextGlobal,null);assert.strictEqual(compat.authority.mayComplete,false);assert.throws(()=>S.deriveAuthoritative({}),/GITHUB_STATE_REQUIRED/);

const gh={state:'ACTIVE',git:{mainSha:'a'.repeat(40),baseSha:'a'.repeat(40),headSha:'b'.repeat(40),branch:'agent/TZ-ROADMAP-55-SG-01'},authority:{durableTruth:'github'}};
const gst=S.derive({githubProjection:gh,liveReconciliation:{status:'CONSISTENT',failClosed:false,drift:[],github:gh},workItems:[]});
assert.strictEqual(gst.source,'github');assert.strictEqual(gst.queue.source,'github');assert.strictEqual(gst.queue.nextGlobal,null);assert.strictEqual(gst.authority.claim,'git-branch-ref');
const qgh=Q.project({githubProjection:gh,workItems:[]});assert.strictEqual(qgh.source,'github');assert.strictEqual(qgh.failClosed,undefined);assert.strictEqual(qgh.authority.claim,'git-branch-ref');

const st=S.derive({githubProjection:gh,liveReconciliation:{status:'STATE_DRIFT_DETECTED',failClosed:true,drift:[{code:'x'}],github:gh},workItems:[]});assert.strictEqual(st.status,'STATE_DRIFT_DETECTED');assert.strictEqual(st.failClosed,true);

const snap=R.snapshot(gst),restored=R.restore(snap);assert.strictEqual(restored.restart.reconstructed,false);assert.strictEqual(restored.restart.githubReconciliationRequired,true);assert.strictEqual(restored.failClosed,true);assert.throws(()=>R.restore({...snap,checksum:'0'.repeat(64)}));
const rebuilt=R.reconstruct(snap,{issue:{number:734,subgoal_id:'TZ-ROADMAP-55-SG-01',state:'OPEN'},mainSha:'a'.repeat(40),baseSha:'a'.repeat(40),headSha:'b'.repeat(40),branch:'agent/TZ-ROADMAP-55-SG-01',claimBranchExists:true,pr:{number:737,state:'OPEN',headBranch:'agent/TZ-ROADMAP-55-SG-01',baseBranch:'main'}});
assert.strictEqual(rebuilt.restart.reconstructed,true);assert.strictEqual(rebuilt.restart.githubReconciled,true);assert.strictEqual(rebuilt.authority.durableTruth,'github');

const live=s.TitanZeroManagerLiveState.reconcile({});assert.strictEqual(live.source,'unavailable');assert.strictEqual(live.failClosed,true);
console.log('PASS test-titan-zero-manager-state-derivation-dependency');

const unavailable=Q.project({});assert.strictEqual(unavailable.source,'unavailable');assert.strictEqual(unavailable.nextGlobal,null);assert.strictEqual(unavailable.authority.maySelectClaimCandidate,false);const legacy=Q.project({allowLegacyProjection:true,packets:[],claims:[],dependencyState:{byPacket:{}}});assert.strictEqual(legacy.source,'legacy-projection');
assert.strictEqual(S.derive({packets:[{packet_id:'LEGACY',status:'AVAILABLE'}],claims:[],agents:[],deltas:[],handoffs:[],verification:[]}).operational,false);assert.strictEqual(S.derive({packets:[{packet_id:'LEGACY',status:'AVAILABLE'}],claims:[],agents:[],deltas:[],handoffs:[],verification:[]}).authority.operationalUse,'diagnostic-only');
assert.strictEqual(S.derive({githubProjection:{state:'AVAILABLE',git:{mainSha:'a'.repeat(40),headSha:'b'.repeat(40),branch:'agent/LEGACY'}}}).operational,undefined);
const q=S.derive({packets:[{packet_id:'LEGACY',status:'AVAILABLE'}],claims:[],agents:[],deltas:[],handoffs:[],verification:[]}).queue;assert.strictEqual(q.operational,false);assert.deepStrictEqual(q.eligible,[]);assert.strictEqual(q.nextGlobal,null);assert.strictEqual(q.authority.mayUnlockDependency,false);
