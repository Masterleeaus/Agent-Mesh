const assert=require('assert');require('./load-pack');
const m=globalThis.CodeeGovernedMutationRequest.create({managerId:'database-manager',action:'database.update',target:'customers',change:{field:'x'}});
assert.strictEqual(m.requirements.captureBackup,true);assert.strictEqual(m.requirements.verifyBackup,true);assert.strictEqual(m.requirements.verifyWrite,true);assert.strictEqual(m.authority.execute,false);
const v=globalThis.CodeeVerificationRequest.create({managerId:'testing-manager',commands:['php artisan test']});assert.strictEqual(v.authority.markStepComplete,false);
const s=globalThis.CodeeManagerSession.create({managerId:'runtime-manager',task:'trace 500'});globalThis.CodeeManagerSession.addEvidence(s,{kind:'log'});globalThis.CodeeManagerSession.close(s);assert.strictEqual(s.status,'closed');assert.throws(()=>globalThis.CodeeManagerSession.addEvidence(s,{kind:'late'}),/closed/);
console.log('governed-requests PASS');
