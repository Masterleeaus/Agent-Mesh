const assert=require('assert');
require('./load-pack');
const b=globalThis.CodeeEvidenceBundle.create({managerId:'runtime-manager',items:[{kind:'log',source:'titan-mcp',value:'500'}]});
assert.strictEqual(b.items.length,1);
const h=globalThis.CodeeHandoffBuilder.build({from:'runtime-manager',to:'laravel-manager',task:'Trace 500',evidence:b});
assert.strictEqual(h.authority.mayAdvancePlan,false);
assert(h.requiredEvidence.length>=1);
console.log('evidence-handoff PASS');
