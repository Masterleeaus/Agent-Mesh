const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={};c.globalThis=c;vm.createContext(c);
vm.runInContext(fs.readFileSync('src/lib/plan-requirement-analyzer.js','utf8'),c,{filename:'src/lib/plan-requirement-analyzer.js'});
const plan=[
 {number:1,text:'Deep scan the repository and inspect the current Laravel architecture.'},
 {number:2,text:'Edit the PHP and JavaScript files, add a database migration, and run phpunit plus npm test.'},
 {number:3,text:'Use Titan MCP to verify the server integration, then package and freshly verify a cumulative ZIP.'},
 {number:4,text:'Run browser UI checks with screenshots and click through the workflow.'}
];
const r=c.CodeePlanRequirementAnalyzer.analyze({plan,protocolMode:'signature_v2',debuggingPlanEnabled:true});
assert.equal(r.schema,'codee.plan.requirements.v1');
assert.equal(r.conversation.required,true);
assert.equal(r.repository.read,true);
assert.equal(r.repository.write,true);
assert.equal(r.repository.commands,true);
assert(r.backup.domains.includes('filesystem'));
assert(r.backup.domains.includes('database'));
assert.equal(r.backup.required,true);
assert.equal(r.artifactHost.required,true);
assert.equal(r.artifactHost.requireContentManifest,true);
assert.equal(r.mcp.required,true);
assert(r.browser.capabilities.includes('browser.screenshot'));
assert(r.browser.capabilities.includes('browser.click'));
assert.equal(r.verification.testsRequired,true);
assert.equal(r.verification.freshArtifactRequired,true);
assert(r.requiredCapabilities.includes('repository.host.write'));
assert(r.requiredCapabilities.includes('repository.host.command'));
assert(r.requiredCapabilities.includes('mcp.tool.call'));
assert(!JSON.stringify(r).toLowerCase().includes('secret-value'));
assert.equal(r.authority.mayAdvancePlan,false);
assert.equal(r.authority.mayMutate,false);
console.log('PASS platform pass9 plan requirement analyzer');
