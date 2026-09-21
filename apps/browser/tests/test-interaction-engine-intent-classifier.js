const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const contractsSource = fs.readFileSync(path.join(root, 'src/interaction-engine/generated/contracts.js'), 'utf8');
const classifierSource = fs.readFileSync(path.join(root, 'src/interaction-engine/generated/intent-classifier.js'), 'utf8');

function makeContext(overrides = {}) {
  return {
    schema: 'titan-interaction/context/v1',
    interaction_id: 'interaction-42',
    company_id: 'company-7',
    actor_id: 'actor-2',
    device_id: 'device-9',
    session_id: 'session-4',
    correlation_id: 'corr-5',
    surface: 'command',
    ...overrides
  };
}

function loadSandbox() {
  const sandbox = { structuredClone, Object, Set, Error, JSON, Number, String, Boolean, Array };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(contractsSource, sandbox);
  vm.runInContext(classifierSource, sandbox);
  return sandbox;
}

const sandbox = loadSandbox();
const classifier = sandbox.TitanInteractionIntentClassifier;
assert.equal(classifier.schema, 'titan-code-interaction-intent-classifier/v1');
assert.equal(classifier.mode, 'deterministic_offline');
assert.equal(classifier.network_required, false);
assert.equal(classifier.provider_required, false);

const fixtures = [
  ['help me please', 'help'],
  ['please create a quote', 'quote'],
  ['send an invoice', 'invoice'],
  ['book an appointment for tomorrow', 'schedule'],
  ['find customer Monica', 'customer.lookup'],
  ['search job 123', 'job.lookup'],
  ['show status', 'status'],
  ['go ahead', 'confirm'],
  ['cancel this', 'cancel'],
  ['utterly unmatched phrase', 'unknown']
];
for (const [input, expected] of fixtures) {
  const first = classifier.classify(input, makeContext());
  const second = classifier.classify(input, makeContext());
  assert.equal(first.kind, expected, input);
  assert.equal(first.source, 'deterministic');
  assert.equal(first.company_id, 'company-7');
  assert.equal(first.correlation_id, 'corr-5');
  assert.deepEqual(first, second, `determinism failed: ${input}`);
  assert.equal(first.intent_id, `intent:interaction-42:${expected}`);
}

assert.throws(() => classifier.classify('', makeContext()), /ERR_INTERACTION_CLASSIFIER_INPUT_INVALID/);
assert.throws(() => classifier.classify('help', makeContext({ company_id: '', tenant_company_id: 'legacy' })), /ERR_INTERACTION_LEGACY_COMPANY_SCOPE/);

// Simulate provider/network absence: classifier has no dependency on either.
assert.equal('fetch' in sandbox, false);
assert.equal('chrome' in sandbox, false);
assert.equal(classifier.classify('create a quote', makeContext()).kind, 'quote');

// Re-evaluating the classic browser script is idempotent.
vm.runInContext(classifierSource, sandbox);
assert.equal(sandbox.TitanInteractionIntentClassifier, classifier);

console.log('PASS interaction intent classifier deterministic offline fixtures');
