'use strict';

const Boundary = require('./skill-runtime-boundary');
const { SkillRegistryLoader } = require('./skill-registry-loader');

const SKILL_EXECUTION_SCHEMA = 'titan-code-skill-execution/v1';
const SKILL_AUDIT_SCHEMA = 'titan-code-skill-execution-audit/v1';
const DEFAULT_BUDGET = Object.freeze({ max_ms: 10_000, max_steps: 64, max_output_bytes: 128 * 1024 });
const HARD_LIMITS = Object.freeze({ max_ms: 60_000, max_steps: 1000, max_output_bytes: 1024 * 1024 });

function fail(code, message, details) {
  const error = new Error(message);
  error.code = code;
  if (details !== undefined) error.details = details;
  return error;
}

function boundedInt(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach(child => deepFreeze(child, seen));
  return Object.freeze(value);
}

function byteLength(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value == null ? null : value);
  if (typeof Buffer !== 'undefined' && Buffer.byteLength) return Buffer.byteLength(text, 'utf8');
  return new TextEncoder().encode(text).length;
}

function normalizeBudget(input = {}) {
  Boundary.assertNoAuthorityEscalation(input);
  return deepFreeze({
    max_ms: boundedInt(input.max_ms, DEFAULT_BUDGET.max_ms, 1, HARD_LIMITS.max_ms),
    max_steps: boundedInt(input.max_steps, DEFAULT_BUDGET.max_steps, 1, HARD_LIMITS.max_steps),
    max_output_bytes: boundedInt(input.max_output_bytes, DEFAULT_BUDGET.max_output_bytes, 64, HARD_LIMITS.max_output_bytes),
  });
}

class SkillExecutionSandbox {
  constructor({ registry, executors = {}, now, setTimer, clearTimer } = {}) {
    if (!(registry instanceof SkillRegistryLoader)) {
      throw fail('ERR_SKILL_EXECUTION_REGISTRY', 'skill execution requires a SkillRegistryLoader');
    }
    Boundary.assertNoAuthorityEscalation(executors);
    this.registry = registry;
    this.executors = new Map();
    this.now = typeof now === 'function' ? now : () => Date.now();
    this.setTimer = typeof setTimer === 'function' ? setTimer : setTimeout;
    this.clearTimer = typeof clearTimer === 'function' ? clearTimer : clearTimeout;
    Object.entries(executors).forEach(([key, executor]) => this.registerExecutor(key, executor));
  }

  registerExecutor(key, executor) {
    if (typeof key !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,95}@[0-9a-z][0-9a-z._+-]{0,31}$/i.test(key)) {
      throw fail('ERR_SKILL_EXECUTION_EXECUTOR_KEY', 'executor key must be id@version');
    }
    if (typeof executor !== 'function') throw fail('ERR_SKILL_EXECUTION_EXECUTOR', 'executor must be a function');
    if (this.executors.has(key)) throw fail('ERR_SKILL_EXECUTION_EXECUTOR_DUPLICATE', 'executor already registered', { key });
    this.executors.set(key, executor);
    return true;
  }

  _audit({ requestId, record, state, startedAt, finishedAt, steps, budget, outputBytes = 0, errorCode = null, cancellationReason = null }) {
    return deepFreeze({
      schema: SKILL_AUDIT_SCHEMA,
      request_id: requestId,
      skill_id: record.id,
      skill_version: record.version,
      state,
      started_at_ms: startedAt,
      finished_at_ms: finishedAt,
      duration_ms: Math.max(0, finishedAt - startedAt),
      steps_used: steps,
      output_bytes: outputBytes,
      budget,
      error_code: errorCode,
      cancellation_reason: cancellationReason,
      input_recorded: false,
      output_recorded: false,
      deterministic_descriptor: true,
      advisory_only: true,
      authority: { ...Boundary.PROTECTED_AUTHORITY },
    });
  }

  async execute({ requestId, skillId, version = '1', input = null, signal = null, budget = {} } = {}) {
    const cleanRequestId = String(requestId || '').trim().slice(0, 160);
    if (!cleanRequestId) throw fail('ERR_SKILL_EXECUTION_REQUEST_ID', 'requestId is required');
    if (signal && signal.aborted) throw fail('ERR_SKILL_EXECUTION_CANCELLED', 'skill execution was already cancelled');

    const record = this.registry.get(skillId, version);
    if (!record || !record.loaded || !record.executable) {
      throw fail('ERR_SKILL_EXECUTION_NOT_LOADED', 'skill is not loaded and executable', { skill_id: skillId, skill_version: version });
    }
    Boundary.assertNoAuthorityEscalation(input);
    const executionBudget = normalizeBudget(budget);
    const key = `${record.id}@${record.version}`;
    const executor = this.executors.get(key);
    if (typeof executor !== 'function') {
      throw fail('ERR_SKILL_EXECUTION_NO_EXECUTOR', 'no executor registered for loaded skill', { key });
    }

    const controller = new AbortController();
    let cancellationReason = null;
    const externalAbort = () => {
      cancellationReason = 'caller-abort';
      controller.abort(cancellationReason);
    };
    if (signal) signal.addEventListener('abort', externalAbort, { once: true });

    let steps = 0;
    const startedAt = this.now();
    let timer = null;
    const timeoutPromise = new Promise((_, reject) => {
      timer = this.setTimer(() => {
        cancellationReason = 'time-budget';
        controller.abort(cancellationReason);
        reject(fail('ERR_SKILL_EXECUTION_TIMEOUT', 'skill execution exceeded time budget', { max_ms: executionBudget.max_ms }));
      }, executionBudget.max_ms);
    });

    const context = Object.freeze({
      request_id: cleanRequestId,
      skill: deepFreeze({ id: record.id, version: record.version, capabilities: record.manifest.capabilities, permissions: record.manifest.permissions }),
      signal: controller.signal,
      budget: executionBudget,
      assertActive() {
        if (controller.signal.aborted) throw fail('ERR_SKILL_EXECUTION_CANCELLED', 'skill execution cancelled', { reason: controller.signal.reason || cancellationReason });
        return true;
      },
      consumeStep(count = 1) {
        const amount = boundedInt(count, 1, 1, HARD_LIMITS.max_steps);
        if (controller.signal.aborted) throw fail('ERR_SKILL_EXECUTION_CANCELLED', 'skill execution cancelled', { reason: controller.signal.reason || cancellationReason });
        if (steps + amount > executionBudget.max_steps) {
          cancellationReason = 'step-budget';
          controller.abort(cancellationReason);
          throw fail('ERR_SKILL_EXECUTION_STEP_BUDGET', 'skill execution exceeded step budget', { max_steps: executionBudget.max_steps });
        }
        steps += amount;
        return steps;
      },
      authority: { ...Boundary.PROTECTED_AUTHORITY },
    });

    try {
      const result = await Promise.race([
        Promise.resolve().then(() => executor(input, context)),
        timeoutPromise,
        new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            if (cancellationReason === 'time-budget' || cancellationReason === 'step-budget') return;
            reject(fail('ERR_SKILL_EXECUTION_CANCELLED', 'skill execution cancelled', { reason: controller.signal.reason || cancellationReason }));
          }, { once: true });
        }),
      ]);
      Boundary.assertNoAuthorityEscalation(result);
      const outputBytes = byteLength(result);
      if (outputBytes > executionBudget.max_output_bytes) {
        throw fail('ERR_SKILL_EXECUTION_OUTPUT_BUDGET', 'skill execution exceeded output budget', { max_output_bytes: executionBudget.max_output_bytes, output_bytes: outputBytes });
      }
      const finishedAt = this.now();
      return deepFreeze({
        schema: SKILL_EXECUTION_SCHEMA,
        request_id: cleanRequestId,
        skill_id: record.id,
        skill_version: record.version,
        status: 'COMPLETED',
        result,
        audit: this._audit({ requestId: cleanRequestId, record, state: 'COMPLETED', startedAt, finishedAt, steps, budget: executionBudget, outputBytes }),
        advisory_only: true,
        authority: { ...Boundary.PROTECTED_AUTHORITY },
      });
    } catch (error) {
      const finishedAt = this.now();
      if (!error.code) error.code = 'ERR_SKILL_EXECUTION_FAILED';
      error.audit = this._audit({
        requestId: cleanRequestId,
        record,
        state: error.code === 'ERR_SKILL_EXECUTION_CANCELLED' ? 'CANCELLED' : 'FAILED',
        startedAt,
        finishedAt,
        steps,
        budget: executionBudget,
        errorCode: error.code,
        cancellationReason,
      });
      throw error;
    } finally {
      if (timer !== null) this.clearTimer(timer);
      if (signal) signal.removeEventListener('abort', externalAbort);
    }
  }
}

module.exports = {
  DEFAULT_BUDGET,
  HARD_LIMITS,
  SKILL_AUDIT_SCHEMA,
  SKILL_EXECUTION_SCHEMA,
  SkillExecutionSandbox,
  normalizeBudget,
};
