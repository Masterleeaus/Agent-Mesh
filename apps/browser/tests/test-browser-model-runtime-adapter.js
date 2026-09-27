'use strict';

const assert = require('assert');
const {
  BrowserModelRuntimeAdapter,
  RUNTIME_KIND,
} = require('../src/intelligence/browser-model-runtime-adapter');

(async () => {
  const calls = [];
  const rpc = {
    async capabilities() { return { offscreen: true, streaming: true }; },
    async request(type, payload, options) {
      calls.push({ type, payload, options });
      return {
        request_id: payload.request_id,
        text: 'local result',
        model: 'browser-small',
        finish_reason: 'stop',
        usage: { input_tokens: 4, output_tokens: 2 },
        runtime: 'webgpu',
      };
    },
  };
  const adapter = new BrowserModelRuntimeAdapter({ rpc, capability: { webgpu: true }, now: () => 1000 });
  const caps = await adapter.capabilities();
  assert.equal(caps.kind, RUNTIME_KIND);
  assert.equal(caps.advisory_only, true);
  assert.equal(caps.authority, false);
  assert.deepEqual(caps.local, { webgpu: true });

  const result = await adapter.generate({ messages: [{ role: 'user', content: 'hello' }] }, {
    requestId: 'req-1', model: 'browser-small', temperature: 0.3, maxTokens: 20,
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].type, 'INTELLIGENCE_BROWSER_MODEL_GENERATE');
  assert.equal(calls[0].payload.schema, 'titan-code-browser-model-request/v1');
  assert.equal(calls[0].payload.request_id, 'req-1');
  assert.equal(calls[0].payload.advisory_only, true);
  assert.equal(calls[0].payload.authority, false);
  assert.equal(result.text, 'local result');
  assert.equal(result.authority, false);
  assert.equal(result.advisory_only, true);

  await assert.rejects(() => adapter.generate('   '), (error) => error.code === 'ERR_BROWSER_MODEL_RUNTIME_INPUT');

  const badCorrelation = new BrowserModelRuntimeAdapter({
    rpc: { request: async () => ({ request_id: 'wrong', text: 'x' }) }, now: () => 1,
  });
  await assert.rejects(() => badCorrelation.generate('hello', { requestId: 'expected' }), (error) => error.code === 'ERR_BROWSER_MODEL_RUNTIME_CORRELATION');

  const authorityInjection = new BrowserModelRuntimeAdapter({
    rpc: { request: async (type, payload) => ({ request_id: payload.request_id, text: 'x', authority: true }) }, now: () => 1,
  });
  await assert.rejects(() => authorityInjection.generate('hello', { requestId: 'safe' }), (error) => error.code === 'ERR_BROWSER_MODEL_RUNTIME_AUTHORITY');

  const controller = new AbortController();
  controller.abort();
  const cancelled = new BrowserModelRuntimeAdapter({
    rpc: { request: async () => { throw new Error('aborted'); } }, now: () => 1,
  });
  await assert.rejects(() => cancelled.generate('hello', { requestId: 'cancel', signal: controller.signal }), (error) => error.code === 'ERR_BROWSER_MODEL_RUNTIME_CANCELLED');

  console.log('PASS browser model runtime adapter');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
