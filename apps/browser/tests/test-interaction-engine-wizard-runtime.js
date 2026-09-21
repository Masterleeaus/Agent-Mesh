const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const scripts = [
  'src/interaction-engine/generated/contracts.js',
  'src/interaction-engine/generated/wizard-runtime.js'
].map((rel) => fs.readFileSync(path.join(root, rel), 'utf8'));
const sandbox = { structuredClone };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
for (const source of scripts) vm.runInContext(source, sandbox);

const definition = {
  schema: 'titan-interaction/wizard-definition/v1',
  wizard_id: 'quote-create', version: '1', company_id: 'company-a', initial_step_id: 'start',
  steps: [
    { step_id: 'start', kind: 'form', required: true, fields: ['service'], next_step_id: 'details' },
    { step_id: 'details', kind: 'form', required: true, fields: ['urgency'], next_step_id: 'review' },
    { step_id: 'priority', kind: 'notice', next_step_id: 'review' },
    { step_id: 'review', kind: 'review', next_step_id: null }
  ]
};
const branches = {
  details: [
    { field: 'urgency', operator: 'equals', value: 'urgent', target_step_id: 'priority', priority: 1 },
    { field: 'urgency', operator: 'in', value: ['normal', 'low'], target_step_id: 'review', priority: 2 }
  ]
};

const runtime = sandbox.TitanInteractionWizardRuntime;
assert.equal(runtime.schema, 'titan-code-wizard-runtime/v1');
assert.equal(runtime.deterministic, true);
assert.equal(runtime.network_required, false);
assert.equal(runtime.provider_required, false);
assert.equal(runtime.authority.plan_advance, false);
assert.equal(runtime.authority.capability_execute, false);

const parsedA = runtime.parseDefinition(definition);
const parsedB = runtime.parseDefinition(definition);
assert.deepEqual(parsedA, parsedB);
assert.equal(Object.isFrozen(parsedA), true);
assert.equal(runtime.validateStep(definition, 'start', {}).valid, false);
assert.deepEqual(Array.from(runtime.validateStep(definition, 'start', {}).missing_fields), ['service']);
assert.equal(runtime.validateStep(definition, 'start', { service: 'cleaning' }).valid, true);
assert.equal(runtime.nextStep(definition, 'start', { service: 'cleaning' }, branches), 'details');
assert.equal(runtime.nextStep(definition, 'details', { urgency: 'urgent' }, branches), 'priority');
assert.equal(runtime.nextStep(definition, 'details', { urgency: 'normal' }, branches), 'review');
assert.equal(runtime.nextStep(definition, 'review', {}, branches), null);
assert.equal(runtime.nextStep(definition, 'details', { urgency: 'urgent' }, branches), runtime.nextStep(definition, 'details', { urgency: 'urgent' }, branches));

const session = runtime.createSession(definition, 'company-a');
assert.equal(session.current_step_id, 'start');
assert.equal(session.completed, false);
const s2 = runtime.advance(definition, session, { service: 'cleaning' }, branches);
assert.equal(s2.current_step_id, 'details');
const s3 = runtime.advance(definition, s2, { urgency: 'urgent' }, branches);
assert.equal(s3.current_step_id, 'priority');
const s4 = runtime.advance(definition, s3, {}, branches);
assert.equal(s4.current_step_id, 'review');
const s5 = runtime.advance(definition, s4, {}, branches);
assert.equal(s5.completed, true);
assert.equal(s5.current_step_id, 'review');

assert.throws(() => runtime.nextStep(definition, 'start', {}, branches), /ERR_WIZARD_STEP_VALIDATION_FAILED/);
assert.throws(() => runtime.validateBranches(definition, { details: [{ field: 'urgency', value: 'x', target_step_id: 'missing' }] }), /ERR_WIZARD_BRANCH_TARGET_UNKNOWN/);
assert.throws(() => runtime.createSession(definition, 'company-b'), /ERR_WIZARD_COMPANY_SCOPE_MISMATCH/);
assert.throws(() => runtime.validateStep(definition, 'start', { tenant_company_id: 'company-a', service: 'cleaning' }), /ERR_WIZARD_LEGACY_COMPANY_SCOPE/);

const offline = { structuredClone };
offline.globalThis = offline;
vm.createContext(offline);
for (const source of scripts) vm.runInContext(source, offline);
assert.equal('fetch' in offline, false);
assert.equal('chrome' in offline, false);
assert.equal(offline.TitanInteractionWizardRuntime.nextStep(definition, 'details', { urgency: 'urgent' }, branches), 'priority');
for (const source of scripts) vm.runInContext(source, sandbox);
assert.equal(sandbox.TitanInteractionWizardRuntime.schema, 'titan-code-wizard-runtime/v1');

console.log('INTERACTION_ENGINE_WIZARD_RUNTIME: PASS');
