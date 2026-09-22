const assert=require('assert'),fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..');const s={console};s.globalThis=s;vm.createContext(s);
const load=r=>vm.runInContext(fs.readFileSync(path.join(root,r),'utf8'),s,{filename:r});
[
'manager-lifecycle','manager-eligibility','manager-github-state','manager-live-state','manager-state-derivation','manager-dependency-engine','manager-queue-state','manager-restart-reconstruction'
].forEach(n=>load(`src/titan-zero/${n}.js`));
const L=s.TitanZeroManagerLifecycle,S=s.TitanZeroManagerStateDerivation,D=s.TitanZeroManagerDependencyEngine,Q=s.TitanZeroManagerQueueState,R=s.TitanZeroManagerRestartReconstruction;
assert(L&&S&&D&&Q&&R,'new manager state modules must exist');
assert.strictEqual(L.get({status:'DONE'}),'MERGED');
assert.strictEqual(L.get({state:'MERGED'}),'MERGED');
assert.strictEqual(L.get({status:'PROMOTED'}),'MERGED');
assert.strictEqual(L.get({state:'ACTIVE',status:'DONE'}),'ACTIVE','canonical state wins conflicts');
assert.strictEqual(L.get({status:'ACTIVE'}),'ACTIVE');
assert.strictEqual(L.dependencySatisfied({status:'DONE'}),false);
assert.strictEqual(L.dependencySatisfied({state:'MERGED'}),false);assert.strictEqual(L.dependencySatisfied({state:'MERGED',source:'github'}),true);
assert.strictEqual(L.dependencySatisfied({status:'PROMOTED'}),false);
for(const x of ['CONVERGENCE_PENDING','ACTIVE','CLAIMED','VERIFYING']) assert.strictEqual(L.dependencySatisfied({status:x}),false,x+' must not satisfy hard dependencies');

const lifecyclePackets=[
 {packet_id:'LEGACY',status:'DONE'},
 {packet_id:'MERGED',state:'MERGED'},
 {packet_id:'PROMOTED',status:'PROMOTED'},
 {packet_id:'PENDING',status:'CONVERGENCE_PENDING'},
 {packet_id:'WAIT_LEGACY',state:'AVAILABLE',dependencies:['LEGACY'],priority:'P0',owner_lane:'Agent 1'},
 {packet_id:'WAIT_MERGED',status:'AVAILABLE',dependencies:['MERGED'],priority:'P0',owner_lane:'Agent 1'},
 {packet_id:'WAIT_PROMOTED',status:'AVAILABLE',dependencies:['PROMOTED'],priority:'P0',owner_lane:'Agent 1'},
 {packet_id:'WAIT_PENDING',status:'AVAILABLE',dependencies:['PENDING'],priority:'P0',owner_lane:'Agent 1'},
 {packet_id:'STATE_ONLY',state:'AVAILABLE',priority:'P1',owner_lane:'Agent 2'},
 {packet_id:'STATUS_ONLY',status:'AVAILABLE',priority:'P1',owner_lane:'Agent 2'}
];
const lifeDep=D.derive(lifecyclePackets,{});
assert.deepStrictEqual(Array.from(lifeDep.completedPackets),[]);
assert.strictEqual(lifeDep.byPacket.WAIT_LEGACY.eligible,false);
assert.strictEqual(lifeDep.byPacket.WAIT_MERGED.eligible,false);
assert.strictEqual(lifeDep.byPacket.WAIT_PROMOTED.eligible,false);
assert.strictEqual(lifeDep.byPacket.WAIT_PENDING.eligible,false);
const lifeQ=Q.project({packets:lifecyclePackets,claims:[],dependencyState:lifeDep});
assert.deepStrictEqual(Array.from(lifeQ.eligible),[]);assert.strictEqual(lifeQ.nextGlobal,null);assert.strictEqual(lifeQ.authority.maySelectClaimCandidate,false);

const packets=[
 {packet_id:'A',status:'DONE'},
 {packet_id:'B',status:'AVAILABLE',dependencies:['A'],priority:'P0',owner_lane:'Agent 1'},
 {packet_id:'C',status:'AVAILABLE',dependencies:['MISSING'],priority:'P1',owner_lane:'Agent 1'},
 {packet_id:'D',status:'AVAILABLE',priority:'P2',owner_lane:'Agent 2',exclusive_hotspots:['bridge']}
];
const dep=D.derive(packets,{activeClaims:[{agent:'Agent 2',packet:'Z',lane:'bridge_only',status:'ACTIVE',exclusive_hotspots:['bridge']} ]});
assert.deepStrictEqual(Array.from(dep.completedPackets),[]);
assert.strictEqual(dep.byPacket.B.eligible,false);
assert.strictEqual(dep.byPacket.C.eligible,false);
assert(dep.byPacket.C.blockers.includes('dependency:MISSING'));
assert.strictEqual(dep.byPacket.D.eligible,false);
assert(dep.byPacket.D.blockers.includes('exclusive-hotspot:bridge'));
const q=Q.project({packets,claims:[{agent:'Agent 1',packet:'B',status:'ACTIVE'}],dependencyState:dep});
assert.strictEqual(q.counts.active,1);
assert.strictEqual(q.nextGlobal,null);assert.deepStrictEqual(Object.keys(q.nextByLane),[]);
const consistentPackets=packets.map(p=>p.packet_id==='B'?{...p,status:'ACTIVE'}:p);
const st=S.derive({packets:consistentPackets,claims:[{agent:'Agent 1',packet:'B',status:'ACTIVE'}],agents:[{workspace:'Agent 1',status:'ACTIVE',current_work_packet:'B'}],deltas:[{packet_id:'X',status:'READY'}],handoffs:[{packet_id:'X',result:'READY_FOR_COORDINATOR_REVIEW'}],verification:[{packet_id:'X',result:'VERIFIED_LOCAL_LANE'}]});
assert.strictEqual(st.status,'CONSISTENT');
assert.strictEqual(st.failClosed,true);assert.strictEqual(st.diagnostics.activeClaims.length,1);assert.strictEqual(st.diagnostics.convergencePending.length,1);
assert.strictEqual(st.queue.counts.pendingConvergence,1);
const stale=S.derive({packets:[{packet_id:'B',status:'AVAILABLE'}],claims:[{agent:'Agent 1',packet:'B',status:'ACTIVE'}],agents:[{workspace:'Agent 1',status:'ACTIVE',current_work_packet:'B'}]});
assert.strictEqual(stale.status,'STATE_DRIFT_DETECTED');
assert(stale.drift.some(x=>x.code==='packet-claims-state-drift'));
const snap=R.snapshot(st);const restored=R.restore(snap);
assert.strictEqual(restored.schema,'titan-zero.manager.derived-state.v3');
assert.strictEqual(restored.restart.reconstructed,false);
assert.strictEqual(restored.restart.cacheIntegrityVerified,true);
assert.strictEqual(restored.restart.githubReconciliationRequired,true);
assert.strictEqual(restored.failClosed,true);
assert.throws(()=>R.restore({...snap,checksum:'0'.repeat(64)}));
const rebuilt=R.reconstruct(snap,{issue:{number:734,subgoal_id:'TZ-ROADMAP-55-SG-01',state:'OPEN'},mainSha:'a'.repeat(40),baseSha:'a'.repeat(40),headSha:'b'.repeat(40),branch:'agent/TZ-ROADMAP-55-SG-01',claimBranchExists:true,pr:{number:737,state:'OPEN',headBranch:'agent/TZ-ROADMAP-55-SG-01',baseBranch:'main'}});
assert.strictEqual(rebuilt.restart.reconstructed,true);assert.strictEqual(rebuilt.restart.githubReconciled,true);assert.strictEqual(rebuilt.restart.localClaimsAuthoritative,false);assert.strictEqual(rebuilt.github.git.branch,'agent/TZ-ROADMAP-55-SG-01');assert.strictEqual(rebuilt.authority.durableTruth,'github');
console.log('PASS test-titan-zero-manager-state-derivation-dependency');

const gh={state:'ACTIVE',git:{mainSha:'a'.repeat(40),headSha:'b'.repeat(40),branch:'agent/TZ-ROADMAP-55-SG-01'},authority:{durableTruth:'github'}};
const gst=S.derive({githubProjection:gh,liveReconciliation:{status:'CONSISTENT',failClosed:false,drift:[],github:gh},workItems:[{subgoal_id:'NEXT',priority:'P0',lifecycle:'AVAILABLE'},{subgoal_id:'ACTIVE',priority:'P0',lifecycle:'ACTIVE'}]});
assert.strictEqual(gst.source,'github');assert.strictEqual(gst.lifecycle,'ACTIVE');assert.strictEqual(gst.queue.source,'github');assert.strictEqual(gst.queue.nextGlobal.subgoal_id,'NEXT');assert.strictEqual(gst.authority.claim,'git-branch-ref');
assert.strictEqual(typeof S.deriveAuthoritative,'function');assert.throws(()=>S.deriveAuthoritative({}),/GITHUB_STATE_REQUIRED/);const authoritative=S.deriveAuthoritative({githubProjection:{state:'ACTIVE',git:{mainSha:'a'.repeat(40),headSha:'b'.repeat(40),branch:'agent/TZ-ROADMAP-55-SG-01'}},workItems:[]});assert.equal(authoritative.source,'github');assert.equal(authoritative.authority.durableTruth,'github');assert.equal(authoritative.authority.localProjectionOnly,true);
const noGithub=S.derive({packets:[{packet_id:'P',status:'AVAILABLE'}],claims:[]});assert.equal(noGithub.source,'unavailable');assert.equal(noGithub.failClosed,true);assert.equal(noGithub.authority.mayClaim,false);

const unavailable=S.derive({packets:[],claims:[]});assert.strictEqual(unavailable.status,'GITHUB_STATE_REQUIRED');assert.strictEqual(unavailable.failClosed,true);assert.strictEqual(unavailable.authority.mayClaim,false);
const compat=S.derive({compatibilityMode:true,packets:[],claims:[],agents:[],deltas:[],handoffs:[],verification:[]});assert.strictEqual(compat.source,'legacy-projection');assert.strictEqual(compat.authority.mayRequestMerge,false);
const Q=S.TitanZeroManagerQueueState;const q=Q.project({});assert.strictEqual(q.status,'GITHUB_STATE_REQUIRED');assert.strictEqual(q.failClosed,true);const l=S.TitanZeroManagerLiveState;const ls=l.reconcile({});assert.strictEqual(ls.status,'GITHUB_STATE_REQUIRED');assert.strictEqual(ls.failClosed,true);

const auth=S.deriveAuthoritative({githubProjection:{state:'ACTIVE',git:{mainSha:'a'.repeat(40),baseSha:'a'.repeat(40),headSha:'b'.repeat(40),branch:'agent/TZ-ROADMAP-55-SG-01'}},liveReconciliation:{status:'CONSISTENT',drift:[]},workItems:[]});assert.strictEqual(auth.source,'github');assert.strictEqual(auth.authority.durableTruth,'github');assert.throws(()=>S.deriveAuthoritative({packets:[],claims:[]} ),/AUTHORITATIVE_GITHUB_STATE_REQUIRED/);

const legacyOnly=Q.projectLegacy({packets:[{packet_id:'LEGACY_NEXT',status:'AVAILABLE',priority:'P0'}],claims:[],dependencyState:{byPacket:{LEGACY_NEXT:{eligible:true}}},convergencePending:['LEGACY_NEXT']});assert.strictEqual(legacyOnly.source,'legacy-projection');assert.deepStrictEqual(Array.from(legacyOnly.eligible),[]);assert.strictEqual(legacyOnly.nextGlobal,null);assert.strictEqual(legacyOnly.authority.maySelectClaimCandidate,false);assert.strictEqual(legacyOnly.authority.mayUnlockDependency,false);assert.strictEqual(legacyOnly.authority.mayAdvanceLifecycle,false);assert.strictEqual(legacyOnly.authority.mayRequestMerge,false);
const legacyState=S.deriveLegacy({packets:[{packet_id:'LEGACY_NEXT',status:'AVAILABLE'}],claims:[],agents:[],deltas:[],handoffs:[],verification:[]});assert.strictEqual(legacyState.failClosed,true);assert.strictEqual(legacyState.authority.mayClaim,false);assert.strictEqual(legacyState.authority.mayComplete,false);assert.strictEqual(legacyState.queue.nextGlobal,null);

const noGithub=S.derive({packets:[{packet_id:'LEGACY',status:'AVAILABLE'}],claims:[]});assert.strictEqual(noGithub.source,'github');assert.strictEqual(noGithub.failClosed,true);assert.strictEqual(noGithub.drift[0].code,'github-state-required');
const qNoGithub=Q.project({packets:[{packet_id:'LEGACY',status:'AVAILABLE'}]});assert.strictEqual(qNoGithub.source,'github');assert.strictEqual(qNoGithub.nextGlobal,null);assert.strictEqual(qNoGithub.authority.localQueueProjectionOnly,true);

const legacyQueue=Q.projectLegacy({packets:[{packet_id:'LEGACY',priority:'P0',status:'AVAILABLE'}],claims:[],dependencyState:{byPacket:{LEGACY:{eligible:true}}}});assert.strictEqual(legacyQueue.nextGlobal,null);assert.deepStrictEqual(legacyQueue.nextByLane,{});assert.deepStrictEqual(legacyQueue.legacyCandidates,['LEGACY']);assert.strictEqual(legacyQueue.authority.maySelectClaimCandidate,false);assert.strictEqual(legacyQueue.authority.mayUnlockDependency,false);assert.strictEqual(legacyQueue.authority.mayAdvanceLifecycle,false);assert.strictEqual(legacyQueue.authority.mayRequestMerge,false);

const unavailable=S.derive({packets:[{packet_id:'LEGACY',status:'AVAILABLE'}]});assert.strictEqual(unavailable.source,'unavailable');assert.strictEqual(unavailable.failClosed,true);assert.strictEqual(unavailable.authority.mayClaim,false);const explicitLegacy=S.derive({allowLegacyProjection:true,packets:[],claims:[],agents:[],deltas:[],handoffs:[],verification:[]});assert.strictEqual(explicitLegacy.source,'legacy-projection');assert.strictEqual(explicitLegacy.failClosed,true);
