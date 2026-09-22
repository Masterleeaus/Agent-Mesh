const assert=require('assert'),fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..'),s={console};s.globalThis=s;vm.createContext(s);
for(const f of ['manager-self-claim','manager-auto-rollover'])vm.runInContext(fs.readFileSync(path.join(root,'src/titan-zero',f+'.js'),'utf8'),s,{filename:f});
const R=s.TitanZeroManagerAutoRollover;
const agent={lane:'manager_core',capabilities:['repo']};
const issues=[
 {number:723,subgoal_id:'SG723',state:'OPEN',priority:'P0',owner_lane:'manager_core',roadmap_pass:2},
 {number:724,subgoal_id:'SG724',state:'OPEN',priority:'P1',owner_lane:'manager_core',roadmap_pass:3}
];
let p=R.plan('Agent 6',agent,{subgoal_id:'SG722'},issues,{claimBranches:[],openPRs:[],dependencyState:{byIssue:{SG723:{eligible:true},SG724:{eligible:true}}}});
assert.strictEqual(p.next.subgoal_id,'SG723');
assert.strictEqual(p.next_claim_branch,'agent/SG723');
assert.strictEqual(p.action,'CREATE_GITHUB_CLAIM_REF');
assert.strictEqual(p.localMutation,false);
const req=R.claimRequest('Agent 6',agent,p,'a'.repeat(40));
assert.strictEqual(req.ref,'refs/heads/agent/SG723');
assert.strictEqual(req.operation,'CREATE_GITHUB_REF_ATOMICALLY');
assert.strictEqual(req.expected_absent,true);assert.strictEqual(req.on_conflict,'CLAIM_LOST_REFRESH_GITHUB_AND_RESELECT');
p=R.plan('Agent 6',agent,{subgoal_id:'SG722'},issues,{claimBranches:['agent/SG723','agent/SG724']});
assert.strictEqual(p.next,null);assert.strictEqual(p.action,'WAIT_FOR_ELIGIBLE_ISSUE');
assert.throws(()=>R.rollover(),/LOCAL_ROLLOVER_FORBIDDEN/);
console.log('PASS test-titan-zero-manager-auto-rollover');

p=R.plan('Agent 6',agent,{subgoal_id:'SG722'},issues,{openPRs:[{state:'OPEN',headBranch:'agent/SG723'}],claimBranches:[]});
assert.strictEqual(p.next.subgoal_id,'SG724','open GitHub PR head must prevent duplicate rollover claim');
