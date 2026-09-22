const assert=require('assert');
const fs=require('fs');const vm=require('vm');
const ctx={globalThis:{}};ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync('src/titan-zero/manager-workspace-ledger.js','utf8'),ctx);
const W=ctx.TitanZeroManagerWorkspaceLedger;
assert.equal(W.authority.repositoryBaseline,'git-main-sha');assert.equal(W.authority.generation,'legacy-artifact-compatibility-only');
assert.equal(W.assertGitBase('a'.repeat(40),'a'.repeat(40)),true);assert.throws(()=>W.assertGitBase('a'.repeat(40),'b'.repeat(40)),/REBASE_REQUIRED/);
function base(){return {revision:4,generation:2,packets:[
 {packet_id:'SAFE',state:'ACTIVE',exclusive_hotspots:['sidebar'],changed_paths:['src/sidebar/**']},
 {packet_id:'COLLIDE',state:'ACTIVE',exclusive_hotspots:['service-worker'],changed_paths:['src/lib/service-worker.js']}
],agents:{
 'Agent 1':{state:'ACTIVE',execution_active:true,current_packet:'SAFE',working_generation:2},
 'Agent 2':{state:'ACTIVE',execution_active:true,current_packet:'COLLIDE',working_generation:2}
},claims:[]};}
const artifact={name:'Titan-Code-CANONICAL.zip',sha256:'abc',library_file_id:'libfile_x',current_version_number:3,changed_hotspots:['service-worker'],changed_paths:['src/lib/service-worker.js'],requires_global_rebase:false};
const out=W.promote(base(),4,artifact,{updated_at:'2026-09-13T20:30:00+10:00'});
assert.equal(out.generation,3);
assert.equal(out.agents['Agent 1'].state,'ACTIVE');
assert.equal(out.agents['Agent 1'].rebase_required,false);
assert.equal(out.agents['Agent 1'].generation_drift,'SOFT_ALLOWED');
assert.equal(out.agents['Agent 1'].target_generation,3);
assert.equal(out.agents['Agent 1'].rebase_at_convergence,true);
assert.equal(out.agents['Agent 2'].state,'REBASE_REQUIRED');
assert.equal(out.agents['Agent 2'].rebase_required,true);
assert.equal(out.agents['Agent 2'].target_generation,3);
assert(out.agents['Agent 2'].rebase_reason.includes('hotspot'));

const global=W.promote(base(),4,{...artifact,requires_global_rebase:true},{updated_at:'2026-09-13T20:31:00+10:00'});
assert.equal(global.agents['Agent 1'].state,'REBASE_REQUIRED');
assert.equal(global.agents['Agent 2'].state,'REBASE_REQUIRED');

const contract=W.promote(base(),4,{...artifact,changed_hotspots:[],changed_paths:[],contract_breaking:true},{updated_at:'2026-09-13T20:32:00+10:00'});
assert.equal(contract.agents['Agent 1'].state,'REBASE_REQUIRED');

console.log('test-titan-zero-manager-selective-promotion-rebase: PASS');
