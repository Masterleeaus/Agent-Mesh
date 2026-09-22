const assert=require('assert'),fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..'),s={console};s.globalThis=s;vm.createContext(s);
for(const f of ['manager-workspace-ledger','manager-self-claim','manager-verification-plan'])vm.runInContext(fs.readFileSync(path.join(root,'src/titan-zero',f+'.js'),'utf8'),s,{filename:f});
const L=s.TitanZeroManagerWorkspaceLedger,C=s.TitanZeroManagerSelfClaim,V=s.TitanZeroManagerVerificationPlan;
let ledger=L.normalize({revision:4,generation:7,canonical:{artifact:'CANONICAL.zip',sha256:'abc'},agents:{'Agent 6':{lane:'manager_core',capabilities:['manager']}},claims:[],packets:[],history:{reset_event:{event:'ORIGINAL'},manager_events:[]}});
ledger=L.commit(ledger,4,d=>{d.history.manager_events.push({event:'reset'});return d;},{updated_by:'test',updated_at:'2026-09-13T00:00:00Z'});assert.strictEqual(ledger.revision,5);assert.strictEqual(ledger.history.reset_event.event,'ORIGINAL');assert.strictEqual(ledger.history.manager_events.at(-1).event,'reset');assert.throws(()=>L.commit(ledger,4,d=>d),/REVISION_CONFLICT/);

assert.throws(()=>L.promote(ledger,5,{}),/LOCAL_PROMOTION_FORBIDDEN/);
const packets=[{packet_id:'OWN',status:'AVAILABLE',priority:'P1',owner_lane:'browser_intelligence',roadmap_pass:2},{packet_id:'BEST',status:'AVAILABLE',priority:'P0',owner_lane:'manager_core',roadmap_pass:1}];
let pick=C.select({lane:'browser_intelligence',capabilities:[]},packets,{claims:[],dependencyState:{byPacket:{OWN:{eligible:true},BEST:{eligible:true}}}});assert.strictEqual(pick.selected.packet_id,'BEST');
assert.throws(()=>C.claim('Agent 6',{lane:'browser_intelligence'},pick.selected,5,7),/LOCAL_CLAIM_FORBIDDEN/);
const req=C.claimRequest('Agent 6',{lane:'browser_intelligence'},pick.selected,'a'.repeat(40));
assert.strictEqual(req.branch,'agent/BEST');assert.strictEqual(req.ref,'refs/heads/agent/BEST');assert.strictEqual(req.operation,'CREATE_GITHUB_REF_ATOMICALLY');assert.strictEqual(req.localMutation,false);
assert.strictEqual(V.plan({event:'pass'}).tier,'IMPACT');assert.strictEqual(V.plan({event:'promotion'}).tier,'FULL');
console.log('PASS test-titan-zero-manager-workspace-ledger-self-claim');

pick=C.select({lane:'manager_core',capabilities:[]},packets,{claimBranches:['agent/BEST'],dependencyState:{byPacket:{OWN:{eligible:true},BEST:{eligible:true}}}});
assert.strictEqual(pick.selected.packet_id,'OWN','existing canonical GitHub claim branch must exclude candidate');
pick=C.select({lane:'manager_core',capabilities:[]},packets,{openPRs:[{head:{ref:'agent/BEST'}}],dependencyState:{byPacket:{OWN:{eligible:true},BEST:{eligible:true}}}});
assert.strictEqual(pick.selected.packet_id,'OWN','open PR head must exclude already-claimed candidate');
assert.throws(()=>C.claimRequest('Agent 6',{},pick.selected,'not-a-sha'),/current main git SHA required/);
