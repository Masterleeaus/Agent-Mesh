'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto').webcrypto;
const ROOT = path.resolve(__dirname, '..');
const { SkillRegistryLoader } = require('../src/intelligence/skill-registry-loader');
const { SkillExecutionSandbox } = require('../src/intelligence/skill-execution-sandbox');
const { ModelOutputVerifier } = require('../src/intelligence/model-output-verifier');
const { SkillIntelligenceHostRuntime, normalizeProviderRequest } = require('../src/intelligence/skill-intelligence-host-runtime');

function manifest() {
  return { id: 'repo.answer', version: '1', capabilities: ['repository.search'], permissions: [], executable: true };
}

(async () => {
  const registry = new SkillRegistryLoader({ maxSkills: 8 });
  registry.load(manifest(), { capabilities: ['repository.search'] });
  const sandbox = new SkillExecutionSandbox({ registry });
  const providerCalls = [];
  const providerGateway = {
    async request(input) {
      providerCalls.push(input);
      return { ok: true, provider: 'ollama', model: 'local-test', response: { text: 'local assist', authority: false } };
    },
    status() { return { providers: 1, localProviders: 1 }; },
  };
  sandbox.registerExecutor('repo.answer@1', async (input, ctx) => {
    ctx.consumeStep();
    return {
      request_id: ctx.request_id,
      status: 'OK',
      result: { provider_text: input.provider_context?.response?.text || null, value: input.input?.value || null },
      evidence: [{ source: 'repository', ref: 'src/a.js:1', text: 'const a = 1;', deterministic: true }],
      authority: false,
    };
  });

  const runtime = new SkillIntelligenceHostRuntime({ sandbox, verifier: new ModelOutputVerifier(), providerGateway });
  const cap = runtime.capability();
  assert.strictEqual(cap.existing_intelligence_host_compatible, true);
  assert.strictEqual(cap.local_first_provider_routing, true);
  assert.strictEqual(cap.authority, false);

  const localReq = normalizeProviderRequest({ enabled: true, task: 'assist', allow_cloud: true, cloud_authorized: false }, { planId: 'p' });
  assert.strictEqual(localReq.privacy.allowCloud, false, 'cloud must remain disabled without explicit authorization');
  const cloudReq = normalizeProviderRequest({ enabled: true, task: 'assist', allow_cloud: true, cloud_authorized: true }, {});
  assert.strictEqual(cloudReq.privacy.allowCloud, true);

  const hostSandbox = { console, Buffer, TextEncoder, AbortController, setTimeout, clearTimeout, crypto };
  hostSandbox.globalThis = hostSandbox;
  for (const file of ['src/intelligence/intelligence-contract.js', 'src/intelligence/intelligence-host.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), hostSandbox, { filename: file });
  }
  const C = hostSandbox.CodeeIntelligenceContract;
  const H = hostSandbox.CodeeIntelligenceHost;
  H._resetForTests();
  H.registerRuntime(runtime.asHostRuntime({ id: 'browser-governed-skills' }), { primary: true });
  const ctx = C.createContext({ sessionId: 'skill-host-session', requestId: 'skill-host-req', projectId: 'p1', planId: 'plan1', runId: 'run1' });
  const result = await H.request(ctx, {
    operation: 'skill.execute',
    skillId: 'repo.answer',
    version: '1',
    input: { value: 42 },
    provider: { enabled: true, task: 'assist', allow_cloud: true, cloud_authorized: false, required_capabilities: ['text'] },
    budget: { max_steps: 4, max_ms: 5000, max_output_bytes: 4096 },
  });
  assert.strictEqual(result.verified_result.status, 'OK');
  assert.strictEqual(result.verified_result.result.provider_text, 'local assist');
  assert.strictEqual(result.verified_result.result.value, 42);
  assert.strictEqual(result.provider_context.local_first, true);
  assert.strictEqual(result.authority, false);
  assert.strictEqual(providerCalls.length, 1);
  assert.strictEqual(providerCalls[0].privacy.allowCloud, false);
  assert.strictEqual(H.getRequest('skill-host-req').state, 'completed');

  const health = await H.health();
  assert.strictEqual(health.runtimeCount, 1);
  assert.strictEqual(health.runtimes[0].id, 'browser-governed-skills');

  const noProviderRuntime = new SkillIntelligenceHostRuntime({ sandbox, verifier: new ModelOutputVerifier() });
  await assert.rejects(
    () => noProviderRuntime.execute({ requestId: 'np1', sessionId: 's' }, { skillId: 'repo.answer', provider: { enabled: true, task: 'x' } }),
    err => err.code === 'ERR_SKILL_HOST_PROVIDER_UNAVAILABLE'
  );

  await assert.rejects(
    () => runtime.execute({ requestId: 'bad-op', sessionId: 's' }, { operation: 'other', skillId: 'repo.answer' }),
    err => err.code === 'ERR_SKILL_HOST_OPERATION'
  );

  console.log('PASS test-skill-intelligence-host-runtime');
})().catch(error => { console.error(error); process.exit(1); });
