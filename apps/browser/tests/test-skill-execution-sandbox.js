'use strict';

const assert = require('assert');
const { SkillRegistryLoader } = require('../src/intelligence/skill-registry-loader');
const { SkillExecutionSandbox, SKILL_EXECUTION_SCHEMA, SKILL_AUDIT_SCHEMA } = require('../src/intelligence/skill-execution-sandbox');

function loadedRegistry(id = 'repository.explain-impact', version = '1') {
  const registry = new SkillRegistryLoader({ maxSkills: 4 });
  registry.load({ id, version, capabilities: ['repository.rag'], permissions: ['context.read'] }, {
    capabilities: ['repository.rag'], permissions: ['context.read'],
  });
  return registry;
}

(async () => {
  const registry = loadedRegistry();
  const sandbox = new SkillExecutionSandbox({
    registry,
    executors: {
      'repository.explain-impact@1': async (input, context) => {
        context.assertActive();
        context.consumeStep();
        return { summary: String(input.query || ''), evidence_count: 2, advisory_only: true, authority: false };
      },
    },
    now: (() => { let now = 100; return () => ++now; })(),
  });
  const completed = await sandbox.execute({ requestId: 'req-1', skillId: 'repository.explain-impact', input: { query: 'impact' }, budget: { max_ms: 5000, max_steps: 3, max_output_bytes: 1024 } });
  assert.equal(completed.schema, SKILL_EXECUTION_SCHEMA);
  assert.equal(completed.status, 'COMPLETED');
  assert.equal(completed.audit.schema, SKILL_AUDIT_SCHEMA);
  assert.equal(completed.audit.steps_used, 1);
  assert.equal(completed.audit.input_recorded, false);
  assert.equal(completed.audit.output_recorded, false);
  assert.equal(completed.authority.plan_advance, false);
  assert(Object.isFrozen(completed.audit));

  await assert.rejects(() => sandbox.execute({ requestId: 'missing', skillId: 'not.loaded' }), error => error.code === 'ERR_SKILL_EXECUTION_NOT_LOADED');

  const noExecutor = new SkillExecutionSandbox({ registry });
  await assert.rejects(() => noExecutor.execute({ requestId: 'req-no-executor', skillId: 'repository.explain-impact' }), error => error.code === 'ERR_SKILL_EXECUTION_NO_EXECUTOR');

  const stepRegistry = loadedRegistry('step.skill');
  const stepSandbox = new SkillExecutionSandbox({ registry: stepRegistry, executors: {
    'step.skill@1': async (_input, context) => { context.consumeStep(); context.consumeStep(); return { ok: true }; },
  }});
  await assert.rejects(() => stepSandbox.execute({ requestId: 'steps', skillId: 'step.skill', budget: { max_steps: 1 } }), error => error.code === 'ERR_SKILL_EXECUTION_STEP_BUDGET' && error.audit && error.audit.steps_used === 1);

  const outputRegistry = loadedRegistry('output.skill');
  const outputSandbox = new SkillExecutionSandbox({ registry: outputRegistry, executors: {
    'output.skill@1': async () => ({ text: 'x'.repeat(500) }),
  }});
  await assert.rejects(() => outputSandbox.execute({ requestId: 'output', skillId: 'output.skill', budget: { max_output_bytes: 64 } }), error => error.code === 'ERR_SKILL_EXECUTION_OUTPUT_BUDGET');

  const authorityRegistry = loadedRegistry('authority.skill');
  const authoritySandbox = new SkillExecutionSandbox({ registry: authorityRegistry, executors: {
    'authority.skill@1': async () => ({ authority: true }),
  }});
  await assert.rejects(() => authoritySandbox.execute({ requestId: 'authority', skillId: 'authority.skill' }), error => error.code === 'ERR_SKILL_RUNTIME_AUTHORITY_ESCALATION');

  const cancelRegistry = loadedRegistry('cancel.skill');
  const cancelSandbox = new SkillExecutionSandbox({ registry: cancelRegistry, executors: {
    'cancel.skill@1': async (_input, context) => new Promise((resolve, reject) => {
      context.signal.addEventListener('abort', () => reject(Object.assign(new Error('cancelled'), { code: 'ERR_SKILL_EXECUTION_CANCELLED' })), { once: true });
      setTimeout(() => resolve({ late: true }), 100);
    }),
  }});
  const controller = new AbortController();
  const pending = cancelSandbox.execute({ requestId: 'cancel', skillId: 'cancel.skill', signal: controller.signal, budget: { max_ms: 1000 } });
  controller.abort('user');
  await assert.rejects(() => pending, error => error.code === 'ERR_SKILL_EXECUTION_CANCELLED' && error.audit && error.audit.cancellation_reason === 'caller-abort');

  const timeoutRegistry = loadedRegistry('timeout.skill');
  const timeoutSandbox = new SkillExecutionSandbox({ registry: timeoutRegistry, executors: {
    'timeout.skill@1': async () => new Promise(resolve => setTimeout(() => resolve({ late: true }), 50)),
  }});
  await assert.rejects(() => timeoutSandbox.execute({ requestId: 'timeout', skillId: 'timeout.skill', budget: { max_ms: 5 } }), error => error.code === 'ERR_SKILL_EXECUTION_TIMEOUT' && error.audit && error.audit.cancellation_reason === 'time-budget');

  assert.throws(() => new SkillExecutionSandbox({ registry, executors: { 'bad-key': async () => ({}) } }), error => error.code === 'ERR_SKILL_EXECUTION_EXECUTOR_KEY');

  console.log('skill execution sandbox tests passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
