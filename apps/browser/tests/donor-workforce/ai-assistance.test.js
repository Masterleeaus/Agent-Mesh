const assert=require('assert');
require('./load-pack');
const r=globalThis.CodeeProviderAssistanceRequest.create({managerId:'architecture-manager',task:'Compare two designs',reason:'non-deterministic tradeoff'});
assert.strictEqual(r.mode,'advisory');
assert.strictEqual(r.authority.executeResult,false);
assert.strictEqual(r.authority.advancePlan,false);
console.log('ai-assistance PASS');
