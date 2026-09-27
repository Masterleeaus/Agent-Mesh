
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync('src/lib/production-plan-preflight.js','utf8');
const sandbox={globalThis:{},Date}; sandbox.globalThis=sandbox; vm.createContext(sandbox); vm.runInContext(code,sandbox);
const P=sandbox.CodeeProductionPlanPreflight;
assert(P&&typeof P.evaluate==='function','preflight runtime must export evaluate');
const req={schema:'codee.plan.requirements.v1',
 conversation:{required:true,exactBindingRequired:true},
 provider:{required:true,localOnly:false},
 repository:{read:true,write:true,commands:true,destructive:false},
 backup:{required:true,verifyBeforeMutation:true,domains:['filesystem']},
 artifactHost:{required:true,receiptRequired:true,requireContentManifest:true},
 mcp:{required:false},browser:{required:true,capabilities:['browser.snapshot']},
 privacy:{mode:'STANDARD'},cost:{mode:'UNSPECIFIED',explicitPaidApprovalRequired:true},
 verification:{testsRequired:true,freshArtifactRequired:true,artifactReceiptRequired:true,postWriteVerificationRequired:true,rollbackEvidenceRequired:true},
 requiredCapabilities:['repository.search','repository.host.write','repository.host.command','browser.snapshot'],
 risk:{level:'high'}};
const ready=P.evaluate({requirements:req,evidence:{
 conversation:{bound:true,composerReady:true},
 provider:{available:true,policyCompatible:true,costApproved:true},
 repository:{readReady:true,writeReady:true,commandReady:true,destructiveReady:false},
 backup:{verifiedDomains:['filesystem']},
 artifactHost:{connected:true,receiptCapable:true,contentManifestCapable:true},
 mcp:{ready:false},
 browser:{ready:true,capabilities:['browser.snapshot']},
 workforce:{ready:true},project:{identified:true}
}});
assert.strictEqual(ready.status,'READY');
assert.strictEqual(ready.authority.mayAdvancePlan,false);
assert.strictEqual(ready.authority.mayMutate,false);
const blocked=P.evaluate({requirements:req,evidence:{
 conversation:{bound:true,composerReady:false},
 provider:{available:true,policyCompatible:true,costApproved:false},
 repository:{readReady:true,writeReady:false,commandReady:false},
 backup:{verifiedDomains:[]},artifactHost:{connected:false},browser:{ready:false,capabilities:[]},workforce:{ready:true},project:{identified:true}
}});
assert.strictEqual(blocked.status,'BLOCKED');
assert(blocked.blockers.some(x=>x.code==='conversation.composer-not-ready'));
assert(blocked.blockers.some(x=>x.code==='repository.write-not-ready'));
assert(blocked.blockers.some(x=>x.code==='backup.filesystem-not-verified'));
assert(blocked.blockers.some(x=>x.code==='artifact-host.not-connected'));
assert(blocked.blockers.some(x=>x.code==='browser.capability-missing'));
const warn=P.evaluate({requirements:{...req,provider:{required:false},repository:{read:true,write:false,commands:false,destructive:false},backup:{required:false,domains:[]},artifactHost:{required:false},browser:{required:false,capabilities:[]},requiredCapabilities:['repository.search'],risk:{level:'low'}},evidence:{conversation:{bound:true,composerReady:true},repository:{readReady:true},workforce:{ready:false},project:{identified:false}}});
assert.strictEqual(warn.status,'READY_WITH_WARNINGS');
assert(warn.warnings.length>=1);
assert(!JSON.stringify(ready).includes('secret'));
console.log('PASS: production plan preflight evaluator');
