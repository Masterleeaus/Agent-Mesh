import test from 'node:test';
import assert from 'node:assert/strict';
import { createOnboardingJourneyStore } from '../titan-onboarding/runtime/onboarding-journey-state.mjs';
import { createOnboardingImportStagingAuthority, validateOnboardingImport } from '../titan-onboarding/runtime/import-staging.mjs';
import { projectOnboardingReadiness } from '../titan-onboarding/runtime/onboarding-readiness.mjs';

function journeyStorage() {
  const data = {};
  return {
    data,
    async get(key) { return key in data ? { [key]: structuredClone(data[key]) } : {}; },
    async set(values) { Object.assign(data, structuredClone(values)); },
  };
}

function importDatabase() {
  const records = new Map();
  const key = (context, locator) => `${context.company_id}:${locator.module_id}:${locator.collection}:${locator.record_id}`;
  return {
    records,
    async getRecord(context, locator) { return structuredClone(records.get(key(context, locator)) ?? null); },
    async putRecord(context, record) {
      const k = key(context, record);
      const prior = records.get(k);
      const stored = { ...structuredClone(record), version: Number(prior?.version || 0) + 1 };
      records.set(k, stored);
      return structuredClone(stored);
    },
    async deleteRecord(context, locator) { return records.delete(key(context, locator)); },
  };
}

const configuredBusiness = company_id => ({
  company_id, revision: 1,
  identity: { legal_name: 'Scenario Cleaning Pty Ltd' },
  contact: { email: 'ops@example.com' },
  service_areas: [{ postcode: '3000' }],
  operating_hours: { monday: { open: '09:00', close: '17:00' } },
  authority_granted: false, execution_permitted: false,
});
const configuredCleaning = company_id => ({
  company_id, revision: 1, selections: [{ job_type_id: 'standard-clean' }],
  authority_granted: false, execution_permitted: false,
});
const configuredWorkforce = company_id => ({
  company_id, revision: 1,
  role_selections: [{ role_definition_id: 'cleaner', enabled: true }],
  availability: { timezone: 'Australia/Melbourne' },
  escalation_defaults: [], role_activation_permitted: false, worker_creation_permitted: false,
  scheduling_execution_permitted: false, escalation_execution_permitted: false,
  authority_granted: false, execution_permitted: false,
});
const emptyPayments = company_id => ({ company_id, revision: 0, authority_granted: false, execution_permitted: false });

const validImport = company_id => ({
  company_id,
  customers: [{ external_id: 'cust-1', customer_type: 'individual', display_name: 'Alex Smith', email: 'alex@example.com', phone: '0400000000' }],
  jobs: [{ external_id: 'job-1', customer_external_id: 'cust-1', service_id: 'clean-standard', address: '1 Main St', scheduled_start: '2026-09-20T09:00:00+10:00', scheduled_end: '2026-09-20T11:00:00+10:00', worker_ids: [], price: 180 }],
  history: [{ external_id: 'hist-1', occurred_at: '2025-01-02T00:00:00Z', event_type: 'job_completed', subject_type: 'job', subject_ref: 'job-old-1', summary: 'Historical completion' }],
});

function readiness(company_id, journey, extras = {}) {
  return projectOnboardingReadiness({
    company_id,
    journey,
    business: extras.business ?? null,
    cleaning: extras.cleaning ?? null,
    workforce: extras.workforce ?? null,
    payments: extras.payments ?? null,
    imports: extras.imports ?? null,
  });
}

test('Pass9 first-run scenario starts isolated, non-authoritative, and not operationally ready', async () => {
  const storage = journeyStorage();
  const journey = createOnboardingJourneyStore({ storage, clock: () => 100 });
  const state = await journey.load({ company_id: 'co-first' });
  const report = readiness('co-first', state);
  assert.equal(state.status, 'not_started');
  assert.equal(state.revision, 0);
  assert.equal(state.grants_authority, false);
  assert.equal(report.status, 'missing');
  assert.equal(report.operationally_ready, false);
  assert.deepEqual(report.missing_required_ids, ['journey_state', 'business_setup', 'cleaning_services', 'workforce_setup']);
  assert.equal(report.execution_permitted, false);
});

test('Pass9 resume scenario preserves progress and optimistic revision across a reconstructed journey store', async () => {
  const storage = journeyStorage();
  const first = createOnboardingJourneyStore({ storage, clock: () => 100 });
  let state = await first.start({ company_id: 'co-resume' });
  state = await first.completeStep({ company_id: 'co-resume' }, 'business_identity', { expected_revision: state.revision });
  state = await first.completeStep({ company_id: 'co-resume' }, 'operations', { expected_revision: state.revision });
  const resumedStore = createOnboardingJourneyStore({ storage, clock: () => 999 });
  const resumed = await resumedStore.load({ company_id: 'co-resume' });
  assert.equal(resumed.status, 'in_progress');
  assert.equal(resumed.revision, state.revision);
  assert.deepEqual(resumed.completed_steps, ['business_identity', 'operations']);
  await assert.rejects(() => resumedStore.completeStep({ company_id: 'co-resume' }, 'cleaning_services', { expected_revision: 0 }), /revision_conflict/);
});

test('Pass9 partial-setup scenario identifies exactly the remaining required setup', async () => {
  const storage = journeyStorage();
  const store = createOnboardingJourneyStore({ storage, clock: () => 100 });
  let state = await store.start({ company_id: 'co-partial' });
  state = await store.completeStep({ company_id: 'co-partial' }, 'business_identity', { expected_revision: state.revision });
  state = await store.completeStep({ company_id: 'co-partial' }, 'operations', { expected_revision: state.revision });
  const report = readiness('co-partial', state, { business: configuredBusiness('co-partial') });
  assert.equal(report.status, 'missing');
  assert.deepEqual(report.missing_required_ids, ['cleaning_services', 'workforce_setup']);
  assert.equal(report.items.find(row => row.id === 'business_setup').status, 'configured');
  assert.deepEqual(report.optional_ids, ['payments_communications', 'import_data']);
});

test('Pass9 invalid-import scenario fails validation and cannot create staging state', async () => {
  const database = importDatabase();
  const authority = createOnboardingImportStagingAuthority({ database, clock: () => 200 });
  const invalid = {
    company_id: 'co-invalid',
    customers: [{ display_name: '', email: 'not-an-email', phone: '1' }],
    jobs: [{ customer_external_id: '', service_id: '', address: '', scheduled_start: '', scheduled_end: '', price: -1 }],
    history: [],
  };
  const validation = validateOnboardingImport(invalid);
  assert.equal(validation.summary.ready_to_stage, false);
  assert.ok(validation.summary.invalid_count >= 2);
  await assert.rejects(() => authority.stage({ company_id: 'co-invalid' }, invalid), /invalid rows cannot be staged/);
  assert.equal(database.records.size, 0);
});

test('Pass9 company-switch scenario keeps journey progress and staged imports isolated by company_id', async () => {
  const storage = journeyStorage();
  const database = importDatabase();
  const journey = createOnboardingJourneyStore({ storage, clock: () => 100 });
  const imports = createOnboardingImportStagingAuthority({ database, clock: () => 200 });
  let a = await journey.start({ company_id: 'co-a' });
  a = await journey.completeStep({ company_id: 'co-a' }, 'business_identity', { expected_revision: a.revision });
  const staged = await imports.stage({ company_id: 'co-a' }, validImport('co-a'));
  const b = await journey.load({ company_id: 'co-b' });
  assert.equal(b.status, 'not_started');
  assert.deepEqual(b.completed_steps, []);
  assert.equal(await imports.inspect({ company_id: 'co-b' }, staged.import_id), null);
  const backToA = await journey.load({ company_id: 'co-a' });
  assert.deepEqual(backToA.completed_steps, ['business_identity']);
  assert.equal((await imports.inspect({ company_id: 'co-a' }, staged.import_id)).status, 'STAGED');
});

test('Pass9 restart scenario reconstructs persisted journey and staged import without granting execution', async () => {
  const storage = journeyStorage();
  const database = importDatabase();
  const firstJourney = createOnboardingJourneyStore({ storage, clock: () => 100 });
  const firstImports = createOnboardingImportStagingAuthority({ database, clock: () => 200 });
  let state = await firstJourney.start({ company_id: 'co-restart' });
  for (const step of ['business_identity', 'operations', 'cleaning_services', 'workforce']) {
    state = await firstJourney.completeStep({ company_id: 'co-restart' }, step, { expected_revision: state.revision });
  }
  const staged = await firstImports.stage({ company_id: 'co-restart' }, validImport('co-restart'));
  const restartedJourney = createOnboardingJourneyStore({ storage, clock: () => 999 });
  const restartedImports = createOnboardingImportStagingAuthority({ database, clock: () => 999 });
  const resumed = await restartedJourney.load({ company_id: 'co-restart' });
  const stagedAfterRestart = await restartedImports.inspect({ company_id: 'co-restart' }, staged.import_id);
  const report = readiness('co-restart', resumed, {
    business: configuredBusiness('co-restart'),
    cleaning: configuredCleaning('co-restart'),
    workforce: configuredWorkforce('co-restart'),
    payments: emptyPayments('co-restart'),
    imports: stagedAfterRestart,
  });
  assert.equal(resumed.status, 'in_progress');
  assert.deepEqual(resumed.completed_steps, ['business_identity', 'operations', 'cleaning_services', 'workforce']);
  assert.equal(stagedAfterRestart.status, 'STAGED');
  assert.equal(stagedAfterRestart.execution_permitted, false);
  assert.equal(stagedAfterRestart.authority_granted, false);
  assert.equal(report.status, 'ready');
  assert.equal(report.operationally_ready, true);
  assert.equal(report.execution_permitted, false);
});
