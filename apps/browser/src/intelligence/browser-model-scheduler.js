'use strict';

const SCHEDULER_SCHEMA = 'titan-code-browser-model-scheduler/v2';
const DEFAULT_MAX_CONCURRENT = 1;
const DEFAULT_MAX_QUEUE = 64;
const DEFAULT_MAX_WAIT_MS = 60_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_BASE_MS = 250;
const DEFAULT_RETRY_MAX_MS = 5_000;
const DEFAULT_BACKGROUND_MAX_CONCURRENT = 1;
const DEFAULT_RESOURCE_BUDGET = Object.freeze({ cpu: 100, memory_mb: 1024, energy: 100 });

function schedulerError(code, message, details) {
  const error = new Error(message);
  error.code = code;
  if (details !== undefined) error.details = details;
  return error;
}

function clampInt(value, fallback, min, max) {
  if (!Number.isInteger(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function safeResource(value, fallback, max) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(0, value));
}

function normalizeCost(cost = {}) {
  return Object.freeze({
    cpu: safeResource(cost.cpu, 1, DEFAULT_RESOURCE_BUDGET.cpu),
    memory_mb: safeResource(cost.memory_mb, 64, DEFAULT_RESOURCE_BUDGET.memory_mb),
    energy: safeResource(cost.energy, 1, DEFAULT_RESOURCE_BUDGET.energy),
  });
}

function normalizeBudget(budget = {}) {
  return Object.freeze({
    cpu: safeResource(budget.cpu, DEFAULT_RESOURCE_BUDGET.cpu, 10_000),
    memory_mb: safeResource(budget.memory_mb, DEFAULT_RESOURCE_BUDGET.memory_mb, 64 * 1024),
    energy: safeResource(budget.energy, DEFAULT_RESOURCE_BUDGET.energy, 10_000),
  });
}

function addResources(target, delta) {
  target.cpu += delta.cpu;
  target.memory_mb += delta.memory_mb;
  target.energy += delta.energy;
}

function subtractResources(target, delta) {
  target.cpu = Math.max(0, target.cpu - delta.cpu);
  target.memory_mb = Math.max(0, target.memory_mb - delta.memory_mb);
  target.energy = Math.max(0, target.energy - delta.energy);
}

function resourcesFit(used, cost, budget) {
  return used.cpu + cost.cpu <= budget.cpu
    && used.memory_mb + cost.memory_mb <= budget.memory_mb
    && used.energy + cost.energy <= budget.energy;
}

class BrowserModelScheduler {
  constructor({
    maxConcurrent,
    maxQueue,
    maxWaitMs,
    now,
    sleep,
    online,
    resourceBudget,
    backgroundMaxConcurrent,
    maxRetries,
    retryBaseMs,
    retryMaxMs,
    isRetryable,
  } = {}) {
    this.maxConcurrent = clampInt(maxConcurrent, DEFAULT_MAX_CONCURRENT, 1, 8);
    this.maxQueue = clampInt(maxQueue, DEFAULT_MAX_QUEUE, 1, 512);
    this.maxWaitMs = clampInt(maxWaitMs, DEFAULT_MAX_WAIT_MS, 1000, 10 * 60_000);
    this.maxRetries = clampInt(maxRetries, DEFAULT_MAX_RETRIES, 0, 8);
    this.retryBaseMs = clampInt(retryBaseMs, DEFAULT_RETRY_BASE_MS, 0, 60_000);
    this.retryMaxMs = clampInt(retryMaxMs, DEFAULT_RETRY_MAX_MS, this.retryBaseMs, 5 * 60_000);
    this.backgroundMaxConcurrent = clampInt(backgroundMaxConcurrent, DEFAULT_BACKGROUND_MAX_CONCURRENT, 0, this.maxConcurrent);
    this.resourceBudget = normalizeBudget(resourceBudget);
    this.now = typeof now === 'function' ? now : () => Date.now();
    this.sleep = typeof sleep === 'function' ? sleep : (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    this.online = typeof online === 'function' ? online : () => true;
    this.isRetryable = typeof isRetryable === 'function'
      ? isRetryable
      : (error) => Boolean(error && (error.retryable === true || ['ERR_BROWSER_MODEL_RUNTIME_RPC','ERR_BROWSER_MODEL_RUNTIME_FALLBACK','ERR_PROVIDER_TEMPORARY','ERR_NETWORK'].includes(error.code)));
    this.active = 0;
    this.activeBackground = 0;
    this.resourcesUsed = { cpu: 0, memory_mb: 0, energy: 0 };
    this.queue = [];
    this.sequence = 0;
    this.byRequestId = new Map();
  }

  stats() {
    return Object.freeze({
      schema: SCHEDULER_SCHEMA,
      active: this.active,
      active_background: this.activeBackground,
      queued: this.queue.length,
      queued_background: this.queue.filter((item) => item.background).length,
      max_concurrent: this.maxConcurrent,
      background_max_concurrent: this.backgroundMaxConcurrent,
      max_queue: this.maxQueue,
      resource_budget: Object.freeze({ ...this.resourceBudget }),
      resources_used: Object.freeze({ ...this.resourcesUsed }),
      offline: !this.online(),
      advisory_only: true,
      authority: false,
    });
  }

  cancel(requestId, reason = 'cancelled') {
    const item = this.byRequestId.get(requestId);
    if (!item || item.state !== 'queued') return false;
    item.state = 'cancelled';
    const index = this.queue.indexOf(item);
    if (index >= 0) this.queue.splice(index, 1);
    this.byRequestId.delete(requestId);
    if (item.signal && item.abortHandler) item.signal.removeEventListener('abort', item.abortHandler);
    item.reject(schedulerError('ERR_BROWSER_MODEL_SCHEDULER_CANCELLED', `request ${requestId} was cancelled before execution`, { reason }));
    return true;
  }

  schedule({
    requestId,
    provider = 'local',
    priority = 0,
    signal,
    maxWaitMs,
    task,
    background = false,
    resourceCost,
    requiresNetwork = false,
    allowOffline = true,
    maxRetries,
    retryBaseMs,
    retryMaxMs,
  } = {}) {
    if (typeof requestId !== 'string' || !requestId.trim()) {
      return Promise.reject(schedulerError('ERR_BROWSER_MODEL_SCHEDULER_INPUT', 'requestId must be a non-empty string'));
    }
    if (typeof task !== 'function') {
      return Promise.reject(schedulerError('ERR_BROWSER_MODEL_SCHEDULER_INPUT', 'task must be a function'));
    }
    if (signal && signal.aborted) {
      return Promise.reject(schedulerError('ERR_BROWSER_MODEL_SCHEDULER_CANCELLED', 'request was already cancelled'));
    }
    if (this.byRequestId.has(requestId)) {
      return Promise.reject(schedulerError('ERR_BROWSER_MODEL_SCHEDULER_DUPLICATE', `request ${requestId} is already scheduled`));
    }
    if (this.queue.length >= this.maxQueue && this.active >= this.maxConcurrent) {
      return Promise.reject(schedulerError('ERR_BROWSER_MODEL_SCHEDULER_QUEUE_FULL', 'browser model scheduler queue is full'));
    }

    const cost = normalizeCost(resourceCost);
    if (!resourcesFit({ cpu: 0, memory_mb: 0, energy: 0 }, cost, this.resourceBudget)) {
      return Promise.reject(schedulerError('ERR_BROWSER_MODEL_SCHEDULER_RESOURCE_BUDGET', 'request resource cost exceeds scheduler budget', { cost, budget: this.resourceBudget }));
    }
    if (requiresNetwork === true && allowOffline !== true && !this.online()) {
      return Promise.reject(schedulerError('ERR_BROWSER_MODEL_SCHEDULER_OFFLINE', 'network-required request cannot run while offline'));
    }

    return new Promise((resolve, reject) => {
      const item = {
        requestId: requestId.trim(),
        provider: typeof provider === 'string' && provider.trim() ? provider.trim() : 'local',
        priority: Number.isFinite(priority) ? Math.max(-10, Math.min(10, priority)) : 0,
        enqueuedAt: this.now(),
        seq: this.sequence++,
        maxWaitMs: clampInt(maxWaitMs, this.maxWaitMs, 1000, 10 * 60_000),
        signal,
        task,
        resolve,
        reject,
        state: 'queued',
        abortHandler: null,
        background: background === true,
        resourceCost: cost,
        requiresNetwork: requiresNetwork === true,
        allowOffline: allowOffline === true,
        maxRetries: clampInt(maxRetries, this.maxRetries, 0, 8),
        retryBaseMs: clampInt(retryBaseMs, this.retryBaseMs, 0, 60_000),
        retryMaxMs: clampInt(retryMaxMs, this.retryMaxMs, 0, 5 * 60_000),
      };
      if (signal) {
        item.abortHandler = () => this.cancel(item.requestId, 'abort-signal');
        signal.addEventListener('abort', item.abortHandler, { once: true });
      }
      this.byRequestId.set(item.requestId, item);
      this.queue.push(item);
      this._drain();
    });
  }

  _score(item, now) {
    const ageBoost = Math.floor(Math.max(0, now - item.enqueuedAt) / 1000);
    const foregroundBoost = item.background ? 0 : 25;
    return item.priority * 1000 + ageBoost + foregroundBoost;
  }

  _canStart(item) {
    if (item.background && this.activeBackground >= this.backgroundMaxConcurrent) return false;
    if (!resourcesFit(this.resourcesUsed, item.resourceCost, this.resourceBudget)) return false;
    if (item.requiresNetwork && !item.allowOffline && !this.online()) return false;
    return true;
  }

  _expireQueued(now) {
    for (let i = this.queue.length - 1; i >= 0; i -= 1) {
      const item = this.queue[i];
      if (now - item.enqueuedAt > item.maxWaitMs) {
        this.queue.splice(i, 1);
        this.byRequestId.delete(item.requestId);
        item.state = 'expired';
        if (item.signal && item.abortHandler) item.signal.removeEventListener('abort', item.abortHandler);
        item.reject(schedulerError('ERR_BROWSER_MODEL_SCHEDULER_TIMEOUT', `request ${item.requestId} exceeded scheduler wait budget`));
      }
    }
  }

  _next() {
    const now = this.now();
    this._expireQueued(now);
    if (!this.queue.length) return null;

    let bestIndex = -1;
    let bestScore = -Infinity;
    for (let i = 0; i < this.queue.length; i += 1) {
      const item = this.queue[i];
      if (!this._canStart(item)) continue;
      const score = this._score(item, now) + (item.provider !== this.lastProvider ? 5 : 0) - (item.seq / 1e9);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    return bestIndex >= 0 ? this.queue.splice(bestIndex, 1)[0] : null;
  }

  _retryDelay(item, attempt) {
    if (item.retryBaseMs <= 0) return 0;
    const exponential = item.retryBaseMs * (2 ** Math.max(0, attempt - 1));
    return Math.min(item.retryMaxMs, exponential);
  }

  async _runWithRetry(item) {
    let attempt = 0;
    while (true) {
      if (item.signal && item.signal.aborted) {
        throw schedulerError('ERR_BROWSER_MODEL_SCHEDULER_CANCELLED', 'request was cancelled during execution');
      }
      if (item.requiresNetwork && !item.allowOffline && !this.online()) {
        throw schedulerError('ERR_BROWSER_MODEL_SCHEDULER_OFFLINE', 'network-required request became offline before execution');
      }
      try {
        return await item.task(Object.freeze({
          attempt: attempt + 1,
          max_attempts: item.maxRetries + 1,
          background: item.background,
          offline: !this.online(),
          resource_cost: item.resourceCost,
          advisory_only: true,
          authority: false,
        }));
      } catch (error) {
        if (item.signal && item.signal.aborted) {
          throw schedulerError('ERR_BROWSER_MODEL_SCHEDULER_CANCELLED', 'request was cancelled during retry');
        }
        if (attempt >= item.maxRetries || !this.isRetryable(error)) throw error;
        attempt += 1;
        const delay = this._retryDelay(item, attempt);
        if (delay > 0) await this.sleep(delay);
      }
    }
  }

  _drain() {
    while (this.active < this.maxConcurrent) {
      const item = this._next();
      if (!item) return;
      if (item.signal && item.signal.aborted) {
        this.byRequestId.delete(item.requestId);
        item.state = 'cancelled';
        item.reject(schedulerError('ERR_BROWSER_MODEL_SCHEDULER_CANCELLED', 'request was cancelled before execution'));
        continue;
      }
      this.active += 1;
      if (item.background) this.activeBackground += 1;
      addResources(this.resourcesUsed, item.resourceCost);
      item.state = 'running';
      this.lastProvider = item.provider;
      if (item.signal && item.abortHandler) item.signal.removeEventListener('abort', item.abortHandler);
      Promise.resolve()
        .then(() => this._runWithRetry(item))
        .then(item.resolve, item.reject)
        .finally(() => {
          this.active -= 1;
          if (item.background) this.activeBackground = Math.max(0, this.activeBackground - 1);
          subtractResources(this.resourcesUsed, item.resourceCost);
          this.byRequestId.delete(item.requestId);
          item.state = 'done';
          this._drain();
        });
    }
  }
}

module.exports = {
  BrowserModelScheduler,
  DEFAULT_BACKGROUND_MAX_CONCURRENT,
  DEFAULT_MAX_CONCURRENT,
  DEFAULT_MAX_QUEUE,
  DEFAULT_MAX_RETRIES,
  DEFAULT_MAX_WAIT_MS,
  DEFAULT_RESOURCE_BUDGET,
  DEFAULT_RETRY_BASE_MS,
  DEFAULT_RETRY_MAX_MS,
  SCHEDULER_SCHEMA,
};
