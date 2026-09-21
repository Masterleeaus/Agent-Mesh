const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'src/interaction-engine/generated/contracts.js'), 'utf8');
const sandbox = { structuredClone, JSON, Object, Set, Error, Number };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(script, sandbox, { filename: 'contracts.js' });
vm.runInContext(script, sandbox, { filename: 'contracts.js#reload' });
const C = sandbox.TitanInteractionContracts;
assert.equal(C.schema, 'titan-code-interaction-contracts/v1');
assert.equal(C.company_scope, 'company_id');

const context = C.normalize('InteractionContext', {
  schema: 'titan-interaction/context/v1', interaction_id: 'ix-1', company_id: 'company-a',
  actor_id: 'actor-1', device_id: 'device-1', session_id: 'session-1', correlation_id: 'corr-1', surface: 'command'
});
assert.equal(context.company_id, 'company-a');
assert.equal(Object.isFrozen(context), true);
assert.equal(C.validateScope(context, 'company-a', 'corr-1'), true);
assert.throws(() => C.validateScope(context, 'company-b'), /COMPANY_SCOPE_MISMATCH/);
assert.throws(() => C.normalize('InteractionContext', { ...context, tenant_company_id: 'company-a' }), /LEGACY_COMPANY_SCOPE/);

const intent = C.normalize('InteractionIntent', {
  schema: 'titan-interaction/intent/v1', intent_id: 'intent-1', company_id: 'company-a', correlation_id: 'corr-1',
  kind: 'booking.create', confidence: 0.92, source: 'deterministic', slots: { service: 'cleaning' }
});
assert.equal(intent.intent_id, 'intent-1');
assert.throws(() => C.normalize('InteractionIntent', { ...intent, confidence: 1.2 }), /CONFIDENCE_INVALID/);

const result = C.normalize('InteractionResult', {
  schema: 'titan-interaction/result/v1', result_id: 'result-1', company_id: 'company-a', correlation_id: 'corr-1', status: 'ok',
  intent,
  capability_intent: {
    schema: 'titan-interaction/capability-intent/v1', capability_intent_id: 'cap-intent-1', company_id: 'company-a', correlation_id: 'corr-1',
    capability_id: 'crm.booking.create', availability: 'deferred', risk: 'medium'
  },
  presentation_intent: {
    schema: 'titan-interaction/presentation-intent/v1', presentation_intent_id: 'present-1', company_id: 'company-a', correlation_id: 'corr-1',
    surface: 'command', mode: 'confirmation'
  }
});
assert.deepEqual(JSON.parse(JSON.stringify(result.authority)), {
  plan_advance: false, plan_complete: false, canonical_promote: false, merge: false, verification: false,
  repository_write: false, shell: false, database_mutation: false
});
assert.throws(() => C.normalize('InteractionResult', {
  ...result,
  capability_intent: { ...result.capability_intent, company_id: 'company-b' }
}), /COMPANY_SCOPE_MISMATCH/);

const wizard = C.normalize('WizardDefinition', {
  schema: 'titan-interaction/wizard-definition/v1', wizard_id: 'wizard-1', version: '1', company_id: 'company-a', initial_step_id: 'start',
  steps: [
    { step_id: 'start', kind: 'form', fields: ['name'], next_step_id: 'done' },
    { step_id: 'done', kind: 'summary', next_step_id: null }
  ]
});
assert.equal(wizard.steps.length, 2);
assert.throws(() => C.normalize('WizardDefinition', { ...wizard, initial_step_id: 'missing' }), /INITIAL_STEP_UNKNOWN/);

const journey = C.normalize('JourneyDefinition', {
  schema: 'titan-interaction/journey-definition/v1', journey_id: 'journey-1', version: '1', company_id: 'company-a', initial_step_id: 'start',
  steps: [
    { step_id: 'start', wizard_id: 'wizard-1', offline_policy: 'allowed', next_step_id: 'sync' },
    { step_id: 'sync', capability_id: 'crm.booking.create', offline_policy: 'deferred', next_step_id: null }
  ]
});
assert.equal(journey.steps[1].offline_policy, 'deferred');

for (const [name, contract, stableKey] of [
  ['InteractionContext', context, 'interaction_id'],
  ['InteractionIntent', intent, 'intent_id'],
  ['InteractionResult', result, 'result_id'],
  ['WizardDefinition', wizard, 'wizard_id'],
  ['JourneyDefinition', journey, 'journey_id']
]) {
  const restored = C.deserialize(name, C.serialize(contract));
  assert.equal(restored[stableKey], contract[stableKey], `${name} stable identity changed across serialization`);
  assert.equal(restored.company_id, contract.company_id, `${name} company scope changed across serialization`);
}

console.log('PASS interaction engine canonical contracts');
