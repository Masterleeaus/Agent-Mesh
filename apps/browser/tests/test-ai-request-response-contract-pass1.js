const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const context = vm.createContext({ console, globalThis: {}, crypto: require('crypto').webcrypto });
context.globalThis = context;
for (const file of ['src/ai/ai-sanitizer.js','src/ai/ai-request-contract.js','src/ai/ai-response-contract.js']) {
  vm.runInContext(fs.readFileSync(file,'utf8'), context, { filename: file });
}
const req = context.CodeeAIRequestContract.create({
  requestId: 'req-1', managerId: 'architecture-manager', planId: 'p1', runId: 'r1', stepId: 's1',
  purpose: 'architecture', task: 'Review tenancy', systemInstructions: 'Do not execute', evidence: [{id:'repo:file:a', text:'token=SECRET123'}],
  requiredCapabilities: ['reasoning','structured_output','reasoning'], preferredProviders: ['ollama','gemini'], forbiddenProviders: ['xai'],
  privacyLevel: 'CONFIDENTIAL', costPolicy: { mode: 'FREE_ONLY', maxUsd: 0 }, maximumContext: 12000, maximumOutput: 2000,
  temperature: 0.2, reasoningLevel: 'medium', tools: [{name:'repository.search'}], requiredSchema: { type:'object', required:['findings'] }, timeoutMs: 45000,
  retryPolicy: { maxAttempts: 2 }
});
assert.strictEqual(req.schema, 'codee.ai.request.v1');
assert.strictEqual(req.requestId, 'req-1');
assert.strictEqual(req.privacy.level, 'CONFIDENTIAL');
assert.strictEqual(req.costPolicy.mode, 'FREE_ONLY');
assert.deepStrictEqual(Array.from(req.requiredCapabilities), ['reasoning','structured_output']);
assert.strictEqual(req.authority.mayAdvancePlan, false);
assert.strictEqual(req.authority.mayExecuteMutation, false);
assert.strictEqual(req.authority.mayGrantBrowserPermission, false);
assert(!JSON.stringify(req).includes('SECRET123'), 'request contract must redact obvious secret values in evidence');
assert(Object.isFrozen(req) && Object.isFrozen(req.authority), 'request must be deeply immutable');
assert.throws(() => context.CodeeAIRequestContract.create({ requestId:'x', task:'x', privacyLevel:'NOPE' }), /privacy/i);

const res = context.CodeeAIResponseContract.create({ requestId:'req-1', provider:'gemini', model:'m', response:'ok', structuredResult:{findings:[]}, toolCalls:[{name:'repository.search'}], inputTokens:10, outputTokens:20, costUsd:0, freeStatus:'FREE', latencyMs:123, finishReason:'stop', providerRequestId:'abc', verificationStatus:'UNVERIFIED', authority:{mayAdvancePlan:true, mayExecuteMutation:true} });
assert.strictEqual(res.schema, 'codee.ai.response.v1');
assert.strictEqual(res.requestId, 'req-1');
assert.strictEqual(res.authority.mayAdvancePlan, false);
assert.strictEqual(res.authority.mayExecuteMutation, false);
assert.strictEqual(res.cost.usd, 0);
assert(Object.isFrozen(res));
console.log('AI request/response contracts pass');
