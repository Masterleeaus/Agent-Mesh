const assert=require('assert');const {load}=require('./_workforce-test-loader');const g=load();
let r=g.CodeeWorkforceHostIntegration.prepare({text:'Update the README and architecture documentation handoff'});
assert(r.managers.some(m=>m.id==='documentation-manager'),'documentation tasks must route to Documentation Manager');
r=g.CodeeWorkforceHostIntegration.prepare({text:'Review backup audit approvals and governance policy before release'});
assert(r.managers.some(m=>m.id==='governance-manager'),'governance/audit/backup tasks must route to Governance Manager');
console.log('workforce manager routing completeness OK');
