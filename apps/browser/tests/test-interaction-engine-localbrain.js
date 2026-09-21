const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const scripts = [
  'src/interaction-engine/generated/contracts.js',
  'src/interaction-engine/generated/intent-classifier.js',
  'src/interaction-engine/generated/localbrain.js'
].map((rel) => fs.readFileSync(path.join(root, rel), 'utf8'));

const sandbox = { structuredClone };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
for (const source of scripts) vm.runInContext(source, sandbox);

const context = {
  schema: 'titan-interaction/context/v1',
  interaction_id: 'ix-lb-1',
  company_id: 'company-a',
  actor_id: 'actor-a',
  device_id: 'device-a',
  session_id: 'session-a',
  correlation_id: 'corr-a',
  surface: 'command'
};

const lb = sandbox.TitanInteractionLocalBrain;
assert.equal(lb.schema, 'titan-code-interaction-localbrain/v1');
assert.equal(lb.mode, 'bounded_deterministic_offline');
assert.equal(lb.network_required, false);
assert.equal(lb.provider_required, false);
assert.equal(lb.bridge_required, false);
assert.equal(lb.cloud_used, false);

const resolved = lb.reason('create a quote', context, {
  local_context: [
    { context_id: 'wrong-company', company_id: 'company-b', relevance: 1 },
    { context_id: 'company-only', company_id: 'company-a', relevance: 0.9 },
    { context_id: 'actor-match', company_id: 'company-a', actor_id: 'actor-a', relevance: 0.1 },
    { context_id: 'session-match', company_id: 'company-a', actor_id: 'actor-a', device_id: 'device-a', session_id: 'session-a', relevance: 0 }
  ]
});
assert.equal(resolved.intent.kind, 'quote');
assert.equal(resolved.confidence, 0.93);
assert.equal(resolved.disposition, 'resolved');
assert.equal(resolved.escalation, 'none');
assert.deepEqual(Array.from(resolved.selected_context_ids), ['session-match', 'actor-match', 'company-only']);
assert.equal(resolved.cloud_used, false);
assert.equal(resolved.network_used, false);
assert.equal(resolved.provider_used, false);
assert.equal(resolved.bridge_used, false);
assert.equal(resolved.authority.capability_execute, false);
assert.equal(resolved.authority.plan_advance, false);
assert.equal(resolved.authority.canonical_promote, false);
assert.equal(resolved.authority.repository_write, false);

const unknownA = lb.reason('flibbertigibbet orbital banana', context);
const unknownB = lb.reason('flibbertigibbet orbital banana', context);
assert.deepEqual(unknownA, unknownB);
assert.equal(unknownA.intent.kind, 'unknown');
assert.equal(unknownA.confidence, 0);
assert.equal(unknownA.disposition, 'escalation_recommended');
assert.equal(unknownA.escalation, 'optional_provider');
assert.equal(unknownA.provider_used, false);

const clarification = lb.reason('show status', context, { minimum_confidence: 0.95, model_escalation_confidence: 0.8, provider_escalation_confidence: 0.4 });
assert.equal(clarification.intent.kind, 'status');
assert.equal(clarification.disposition, 'needs_input');
assert.equal(clarification.escalation, 'clarify');

assert.throws(
  () => lb.reason('help', context, { model_escalation_confidence: 0.9, minimum_confidence: 0.8 }),
  /ERR_LOCALBRAIN_THRESHOLD_ORDER_INVALID/
);
assert.throws(
  () => lb.reason('help', context, { local_context: [{ context_id: 'bad', tenant_company_id: 'company-a', company_id: 'company-a' }] }),
  /ERR_LOCALBRAIN_LEGACY_COMPANY_SCOPE/
);

const sandboxOffline = { structuredClone };
sandboxOffline.globalThis = sandboxOffline;
vm.createContext(sandboxOffline);
for (const source of scripts) vm.runInContext(source, sandboxOffline);
assert.equal('fetch' in sandboxOffline, false);
assert.equal('chrome' in sandboxOffline, false);
assert.equal('Ollama' in sandboxOffline, false);
assert.equal('TitanBridge' in sandboxOffline, false);
const offline = sandboxOffline.TitanInteractionLocalBrain.reason('help me', context);
assert.equal(offline.disposition, 'resolved');
assert.equal(offline.intent.kind, 'help');

for (const source of scripts) vm.runInContext(source, sandbox);
assert.equal(sandbox.TitanInteractionLocalBrain.reason('invoice', context).intent.kind, 'invoice');

console.log('INTERACTION_ENGINE_LOCALBRAIN: PASS');
