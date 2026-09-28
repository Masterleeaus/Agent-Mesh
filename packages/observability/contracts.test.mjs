import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeObservation, redactObservationPayload } from './contracts.mjs';

test('redacts secrets, prompts, PII and customer data recursively', () => {
 const event = normalizeObservation({
  company_id: 'co-313',
  event_type: 'provider.failure',
  component: 'payments',
  payload: {
   authorization: 'Bearer secret',
   prompt: 'customer asked for a refund',
   customer_email: 'person@example.com',
   nested: [{ api_key: 'key', safe: 'kept' }],
  },
 });
 assert.deepEqual(event.payload, {
  authorization: '[REDACTED]',
  prompt: '[REDACTED]',
  customer_email: '[REDACTED]',
  nested: [{ api_key: '[REDACTED]', safe: 'kept' }],
 });
});

test('preserves safe diagnostics and still rejects legacy company boundaries', () => {
 const payload = redactObservationPayload({ component: 'runtime', duration_ms: 42 });
 assert.deepEqual(payload, { component: 'runtime', duration_ms: 42 });
 assert.throws(
  () => normalizeObservation({
   company_id: 'co-313',
   event_type: 'runtime.failure',
   component: 'runtime',
   payload: { tenant_id: 'legacy' },
  }),
  /legacy-company-boundary/,
 );
});
