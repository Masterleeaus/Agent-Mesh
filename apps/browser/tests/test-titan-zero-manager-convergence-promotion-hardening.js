'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..'); const ctx={globalThis:{}}; vm.createContext(ctx);
for(const f of ['manager-baseline-state.js','manager-delta-convergence.js','manager-promotion-gate.js','manager-delta-intake.js','manager-convergence-plan.js','manager-baseline-advance.js']){
  vm.runInContext(fs.readFileSync(path.join(root,'src/titan-zero',f),'utf8'),ctx,{filename:f});
}
const G=ctx.globalThis;
const sha='a'.repeat(64), parent='b'.repeat(64), next='c'.repeat(64), mainGit='1'.repeat(40), headGit='2'.repeat(40);
const intake=G.TitanZeroManagerDeltaIntake.create({packetId:'P1',agent:'Agent 1',deltaSha256:sha,baseSha256:parent,changedFiles:['b.js','a.js'],verificationResult:'PASS'});
assert.equal(intake.changedFiles[0],'a.js'); assert.equal(intake.changedFiles[1],'b.js');
assert.throws(()=>G.TitanZeroManagerDeltaIntake.create({packetId:'P1',deltaSha256:'bad',baseSha256:parent}),/sha256/);
const plan=G.TitanZeroManagerConvergencePlan.build({intake,identityValid:true,hashValid:true,dependenciesSatisfied:true,supervisorVerdict:'PASS',baseMatches:true,hotspotCollision:false,regressionPassed:true});
assert.equal(plan.decision,'CLEAN_FORWARD_PORT'); assert.equal(plan.readyForPullRequestGate,true); assert.equal(plan.authority.merge,'github-pr-merge');
const blocked=G.TitanZeroManagerConvergencePlan.build({intake,identityValid:true,hashValid:true,dependenciesSatisfied:true,supervisorVerdict:'FAIL',baseMatches:true,hotspotCollision:false,regressionPassed:true});
assert.equal(blocked.readyForPullRequestGate,false); assert.equal(blocked.decision,'BLOCKED');
const mergeGate=G.TitanZeroManagerPromotionGate.evaluate({identityValid:true,ancestryValid:true,dependenciesSatisfied:true,hotspotsResolved:true,supervisorVerified:true,regressionPassed:true,reconstructionVerified:true,prOpen:true,checksPassed:true,reviewApproved:true});
assert.equal(mergeGate.allowed,true);assert.equal(mergeGate.action,'GITHUB_PR_MERGE_ALLOWED');assert.equal(mergeGate.authority.managerAI,false);
const draftGate=G.TitanZeroManagerPromotionGate.evaluate({identityValid:true,ancestryValid:true,dependenciesSatisfied:true,hotspotsResolved:true,supervisorVerified:true,regressionPassed:true,reconstructionVerified:true,prOpen:true,checksPassed:true,reviewApproved:true,prDraft:true});assert.equal(draftGate.allowed,false);assert(draftGate.failed.includes('prDraft'));
const baseline=G.TitanZeroManagerBaselineState.create({mainSha:mainGit,artifactSha256:sha,artifact:'candidate.zip'});assert.equal(baseline.mainSha,mainGit);assert.equal(baseline.authority.baseline,'git-main-sha');assert.equal(baseline.authority.artifactHash,'verification-only');
const candidate=G.TitanZeroManagerBaselineAdvance.create({mainSha:mainGit,baseSha:mainGit,headSha:headGit,artifactSha256:next,artifact:'candidate.zip',convergenceDecision:'CLEAN_FORWARD_PORT',mergeGate:{allowed:true},supervisorVerdict:'PASS',regressionPassed:true,reconstructionVerified:true});
assert.equal(candidate.status,'READY_FOR_GITHUB_MERGE');assert.equal(candidate.authority.merge,'github-pr-merge');assert.equal(candidate.canonical,false);
const stale=G.TitanZeroManagerBaselineAdvance.create({mainSha:mainGit,baseSha:'3'.repeat(40),headSha:headGit,artifact:'x',convergenceDecision:'CLEAN_FORWARD_PORT',mergeGate:{allowed:true},supervisorVerdict:'PASS',regressionPassed:true,reconstructionVerified:true});assert.equal(stale.status,'BLOCKED');
const noPromo=G.TitanZeroManagerBaselineAdvance.create({mainSha:mainGit,baseSha:mainGit,headSha:headGit,artifact:'x',convergenceDecision:'SEMANTIC_REBASE',mergeGate:{allowed:false},supervisorVerdict:'PASS',regressionPassed:true,reconstructionVerified:true});assert.equal(noPromo.status,'BLOCKED');
console.log('PASS manager convergence + promotion hardening');
