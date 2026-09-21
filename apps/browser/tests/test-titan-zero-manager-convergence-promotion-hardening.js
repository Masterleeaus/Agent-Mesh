'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..'); const ctx={globalThis:{}}; vm.createContext(ctx);
for(const f of ['manager-baseline-state.js','manager-delta-convergence.js','manager-promotion-gate.js','manager-delta-intake.js','manager-convergence-plan.js','manager-baseline-advance.js']){
  vm.runInContext(fs.readFileSync(path.join(root,'src/titan-zero',f),'utf8'),ctx,{filename:f});
}
const G=ctx.globalThis;
const sha='a'.repeat(64), parent='b'.repeat(64), next='c'.repeat(64);
const intake=G.TitanZeroManagerDeltaIntake.create({packetId:'P1',agent:'Agent 1',deltaSha256:sha,baseSha256:parent,changedFiles:['b.js','a.js'],verificationResult:'PASS'});
assert.equal(intake.changedFiles[0],'a.js'); assert.equal(intake.changedFiles[1],'b.js');
assert.throws(()=>G.TitanZeroManagerDeltaIntake.create({packetId:'P1',deltaSha256:'bad',baseSha256:parent}),/sha256/);
const plan=G.TitanZeroManagerConvergencePlan.build({intake,identityValid:true,hashValid:true,dependenciesSatisfied:true,supervisorVerdict:'PASS',baseMatches:true,hotspotCollision:false,regressionPassed:true});
assert.equal(plan.decision,'CLEAN_FORWARD_PORT'); assert.equal(plan.readyForPromotionGate,true);
const blocked=G.TitanZeroManagerConvergencePlan.build({intake,identityValid:true,hashValid:true,dependenciesSatisfied:true,supervisorVerdict:'FAIL',baseMatches:true,hotspotCollision:false,regressionPassed:true});
assert.equal(blocked.readyForPromotionGate,false); assert.equal(blocked.decision,'BLOCKED');
const candidate=G.TitanZeroManagerBaselineAdvance.create({currentBaselineSha256:parent,candidateSha256:next,parentSha256:parent,artifact:'candidate.zip',convergenceDecision:'CLEAN_FORWARD_PORT',promotionGate:{allowed:true},supervisorVerdict:'PASS',regressionPassed:true,reconstructionVerified:true});
assert.equal(candidate.status,'READY_FOR_COORDINATOR_PROMOTION'); assert.equal(candidate.canonical,false);
assert.throws(()=>G.TitanZeroManagerBaselineAdvance.create({currentBaselineSha256:parent,candidateSha256:next,parentSha256:'d'.repeat(64),artifact:'x',convergenceDecision:'CLEAN_FORWARD_PORT',promotionGate:{allowed:true},supervisorVerdict:'PASS',regressionPassed:true,reconstructionVerified:true}),/parent/);
const noPromo=G.TitanZeroManagerBaselineAdvance.create({currentBaselineSha256:parent,candidateSha256:next,parentSha256:parent,artifact:'x',convergenceDecision:'SEMANTIC_REBASE',promotionGate:{allowed:false},supervisorVerdict:'PASS',regressionPassed:true,reconstructionVerified:true});
assert.equal(noPromo.status,'BLOCKED');
console.log('PASS manager convergence + promotion hardening');
