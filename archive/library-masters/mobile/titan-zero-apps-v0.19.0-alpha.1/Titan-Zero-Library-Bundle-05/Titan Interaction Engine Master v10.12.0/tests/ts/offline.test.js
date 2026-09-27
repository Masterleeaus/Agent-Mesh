'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { MemoryStore } = require('../../dist/resources/ts/offline/memory-store.js');
const { EncryptedCommandOutbox } = require('../../dist/resources/ts/offline/command-outbox.js');
const { LocalLanguageEngine } = require('../../dist/resources/ts/offline/local-language.js');

test('encrypted outbox round-trips a command and updates status', async () => {
  const store = new MemoryStore();
  const outbox = new EncryptedCommandOutbox(store, 'test-device-secret');
  const envelope = await outbox.enqueue({
    capability: 'jobs.create',
    payload: { customer_id: 'c1', service_id: 's1' },
    metadata: { company_id: 't1', user_id: 7, device_id: 'd1' },
  });

  assert.equal(envelope.algorithm, 'AES-256-GCM');
  assert.equal((await outbox.pending()).length, 1);
  const command = await outbox.decrypt(envelope.id);
  assert.equal(command.capability, 'jobs.create');
  assert.equal(command.payload.customer_id, 'c1');

  await outbox.markSynced(envelope.id);
  assert.equal((await outbox.pending()).length, 0);
});

test('local language engine extracts a business action while offline', () => {
  const engine = new LocalLanguageEngine();
  const result = engine.understand('Create a quote for Jenny next Thursday morning');
  assert.equal(result.intent, 'create_quote');
  assert.equal(result.entities.customer, 'Jenny');
  assert.equal(result.entities.relativeDate, 'next thursday morning');
  assert.ok(result.confidence >= 0.7);
});

test('sync conflicts remain stored but are not retried automatically', async () => {
  const { OfflineSyncClient } = require('../../dist/resources/ts/offline/sync-client.js');
  const store = new MemoryStore();
  const outbox = new EncryptedCommandOutbox(store, 'test-device-secret');
  await outbox.enqueue({
    capability: 'jobs.complete',
    payload: { job_id: 'j1' },
    metadata: { company_id: 't1', user_id: 7, device_id: 'd1' },
  });
  const fetcher = async () => ({ status: 409, ok: false });
  const result = await new OfflineSyncClient(outbox, '/sync', fetcher).sync();
  assert.equal(result.conflicts, 1);
  assert.equal((await outbox.pending()).length, 0);
  assert.equal((await store.all())[0].status, 'conflict');
});

test('encrypted cognitive events replay by correlation and sequence', async () => {
  const { EncryptedCognitiveEventOutbox } = require('../../dist/resources/ts/offline/cognitive-event-outbox.js');
  const store = new MemoryStore();
  const outbox = new EncryptedCognitiveEventOutbox(store, 'device-cognitive-secret');
  await outbox.enqueue({ eventType: 'outcome_observed', companyId: 't1', deviceId: 'd1', correlationId: 'job-1', sequence: 2, payload: { success: true } });
  await outbox.enqueue({ eventType: 'recommendation_created', companyId: 't1', deviceId: 'd1', correlationId: 'job-1', sequence: 1, payload: { action: 'create_invoice' } });
  await outbox.enqueue({ eventType: 'observation_recorded', companyId: 't1', deviceId: 'd1', correlationId: 'job-2', sequence: 1, payload: { fact: 'complete' } });

  const pending = await outbox.pending();
  assert.deepEqual(pending.map((event) => [event.correlationId, event.sequence]), [
    ['job-1', 1],
    ['job-1', 2],
    ['job-2', 1],
  ]);
  const decrypted = await outbox.decrypt(pending[0].id);
  assert.equal(decrypted.eventType, 'recommendation_created');
  assert.equal(decrypted.companyId, 't1');
});
