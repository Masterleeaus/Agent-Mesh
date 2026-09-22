const assert=require('assert');const fs=require('fs'),vm=require('vm');const ctx={globalThis:{}};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync('src/titan-zero/manager-workspace-ledger.js','utf8'),ctx);const W=ctx.TitanZeroManagerWorkspaceLedger;
assert.equal(W.authority.repositoryBaseline,'git-main-sha');assert.equal(W.authority.generation,'legacy-artifact-compatibility-only');assert(W.LIFECYCLE.includes('PR_OPEN'));assert(!W.LIFECYCLE.includes('PROMOTED'));assert(!W.LIFECYCLE.includes('CONVERGENCE_PENDING'));
assert.equal(W.assertGitBase('a'.repeat(40),'a'.repeat(40)),true);assert.throws(()=>W.assertGitBase('a'.repeat(40),'b'.repeat(40)),/REBASE_REQUIRED/);
const safe={execution_active:true},packet={exclusive_hotspots:['sidebar'],changed_paths:['src/sidebar/**']};
let d=W.integrationRebaseDecision(safe,packet,{changed_hotspots:['service-worker'],changed_paths:['src/lib/service-worker.js']});assert.equal(d.hard,false);
d=W.integrationRebaseDecision(safe,packet,{changed_hotspots:['sidebar']});assert.equal(d.hard,true);assert(d.reason.includes('hotspot'));
d=W.integrationRebaseDecision(safe,packet,{contract_breaking:true});assert.equal(d.hard,true);assert.equal(d.reason,'contract-breaking-integration');
assert.throws(()=>W.promote({},0,{}),/LOCAL_PROMOTION_FORBIDDEN/);
console.log('test-titan-zero-manager-selective-promotion-rebase: PASS');
