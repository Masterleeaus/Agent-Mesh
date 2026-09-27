import test from 'node:test';
import assert from 'node:assert/strict';

import { zeroChatEventFromRuntime } from '../.zero-test-dist/ported/titan-runtime/interaction-engine/zero-runtime-events.js';
import { createZeroAuthorityRequest, dispatchZeroAuthorityRequest } from '../.zero-test-dist/ported/titan-runtime/interaction-engine/zero-authority-bridge.js';

test('Zero runtime projection preserves company/correlation and cannot grant authority', () => {
  const event = zeroChatEventFromRuntime({
    event_id: 'evt-1',
    conversation_id: 'conv-1',
    company_id: 'company-a',
    correlation_id: 'run-1',
    kind: 'approval_required',
    action_id: 'action-1',
    work_id: 'work-1',
    message: 'Approve the schedule change?',
  });

  assert.equal(event.company_id, 'company-a');
  assert.equal(event.conversation_id, 'conv-1');
  assert.equal(event.correlation_id, 'run-1');
  assert.equal(event.type, 'component');
  assert.equal(event.components[0].kind, 'approval');

  assert.throws(() => zeroChatEventFromRuntime({
    event_id: 'evt-2',
    conversation_id: 'conv-1',
    company_id: 'company-a',
    kind: 'progress',
    authority_granted: true,
  }), /cannot-grant-authority/);
});

test('Zero authority bridge waits for approval and never executes early', async () => {
  const request = createZeroAuthorityRequest({
    capability: 'visit.reassign',
    payload: { visit_id: 'visit-1', assigned_user_id: 'sarah' },
    metadata: { company_id: 'company-a', correlation_id: 'conv-1', idempotency_key: 'idem-1' },
  }, {
    company_id: 'company-a',
    actor_id: 'owner-a',
    correlation_id: 'conv-1',
    idempotency_key: 'idem-1',
    request_id: 'request-1',
    approval_required: true,
  });

  assert.equal(request.zero_role, 'request_and_present');
  assert.equal(request.authority_granted, false);
  assert.equal(request.execution_authority_granted, false);

  let gatewayCalls = 0;
  const result = await dispatchZeroAuthorityRequest(request, {
    decide: async () => ({ allowed: true, approved: false, decision_id: 'decision-1' }),
    gateway: { dispatch: async () => { gatewayCalls++; return { ok: true }; } },
  });

  assert.equal(result.status, 'approval_required');
  assert.equal(result.decision_id, 'decision-1');
  assert.equal(gatewayCalls, 0);
});

test('Zero can execute only after Decision boundary allows it and via governed gateway', async () => {
  const request = createZeroAuthorityRequest({
    capability: 'visit.reassign',
    payload: { visit_id: 'visit-1', assigned_user_id: 'sarah' },
    metadata: { company_id: 'company-a', correlation_id: 'conv-2', idempotency_key: 'idem-2' },
  }, {
    company_id: 'company-a',
    actor_id: 'owner-a',
    correlation_id: 'conv-2',
    idempotency_key: 'idem-2',
    request_id: 'request-2',
    approval_required: false,
  });

  const calls = [];
  const result = await dispatchZeroAuthorityRequest(request, {
    decide: async ({ company_id, intent }) => ({ allowed: company_id === 'company-a' && intent.company_id === 'company-a', approved: true, decision_id: 'decision-2' }),
    gateway: {
      dispatch: async (capability, payload, trustedContext) => {
        calls.push({ capability, payload, trustedContext });
        return { execution_id: 'exec-2', verified: true };
      },
    },
  });

  assert.equal(result.status, 'executed');
  assert.equal(result.decision_id, 'decision-2');
  assert.equal(result.authority_granted, false);
  assert.equal(result.execution_authority_granted, false);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].capability, 'visit.reassign');
  assert.equal(calls[0].trustedContext.company_id, 'company-a');

  await assert.rejects(() => dispatchZeroAuthorityRequest({ ...request, authority_granted: true }, {
    decide: async () => ({ allowed: true, approved: true }),
    gateway: { dispatch: async () => ({}) },
  }), /cannot self-grant execution authority/);
});
