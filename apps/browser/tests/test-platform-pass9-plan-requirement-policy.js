const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync('src/lib/plan-requirement-analyzer.js','utf8'),c);
let r=c.CodeePlanRequirementAnalyzer.analyze({plan:[{text:'Read and summarize the repository only. Do not modify files. Use local-only AI and free only; no paid providers.'}],protocolMode:'signature_v2'});
assert.equal(r.repository.read,true);assert.equal(r.repository.write,false);assert.equal(r.backup.required,false);
assert.equal(r.provider.localOnly,true);assert.equal(r.cost.mode,'FREE_ONLY');assert.equal(r.privacy.mode,'LOCAL_ONLY');
assert.equal(r.artifactHost.required,true,'signature-v2 still requires artifact verifier even for read-only plan');
r=c.CodeePlanRequirementAnalyzer.analyze({plan:[{text:'Delete obsolete files and deploy the server configuration after running a migration.'}],protocolMode:'signature_v2'});
assert.equal(r.repository.write,true);assert.equal(r.repository.destructive,true);assert(r.backup.domains.includes('filesystem'));assert(r.backup.domains.includes('database'));assert(r.backup.domains.includes('server'));assert.equal(r.risk.level,'critical');
console.log('PASS platform pass9 requirement policy');
