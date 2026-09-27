(() => {
  const API = '/api/v2/chatbot';
  const STATUSES = Object.freeze([
    'local-only', 'queued', 'sending', 'synced', 'failed', 'needs-review',
    'conflict', 'cancelled', 'deleted-locally', 'deleted-remotely',
  ]);
  const emit = (name, detail = {}) => window.dispatchEvent(new CustomEvent(name, { detail }));

  class ChatbotSyncEngine {
    constructor(adapter, options = {}) {
      if (!adapter) throw new TypeError('A local sync adapter is required.');
      this.adapter = adapter;
      this.deviceId = options.deviceId || localStorage.getItem('chatbot_device_id') || crypto.randomUUID();
      this.fetch = options.fetch || window.fetch.bind(window);
      this.running = false;
      this.registered = false;
      this.connection = options.connection || navigator.connection || null;
      localStorage.setItem('chatbot_device_id', this.deviceId);
    }

    async request(path, init = {}) {
      const headers = { Accept: 'application/json', 'Content-Type': 'application/json', ...(init.headers || {}) };
      const token = document.querySelector('meta[name="csrf-token"]')?.content;
      if (token) headers['X-CSRF-TOKEN'] = token;

      const response = await this.fetch(`${API}${path}`, { credentials: 'include', ...init, headers });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw Object.assign(new Error(body.message || `Sync request failed (${response.status})`), {
          status: response.status,
          body,
        });
      }
      return body.data;
    }

    async register(metadata = {}) {
      const device = await this.request('/devices/register', {
        method: 'POST',
        body: JSON.stringify({ device_id: this.deviceId, ...metadata }),
      });
      this.registered = true;
      emit('chatbot:device-registered', { device });
      return device;
    }

    async ensureRegistered(metadata = {}) {
      if (this.registered) return;
      try {
        await this.request(`/sync/status?device_id=${encodeURIComponent(this.deviceId)}`);
        this.registered = true;
      } catch (error) {
        if (error.status !== 403 && error.status !== 404) throw error;
        await this.register(metadata);
      }
    }

    networkProfile() {
      const effectiveType = this.connection?.effectiveType || 'unknown';
      const saveData = Boolean(this.connection?.saveData);
      const weak = saveData || ['slow-2g', '2g'].includes(effectiveType);
      return { effectiveType, saveData, weak };
    }

    async bootstrap({ entities = [], limit = 500 } = {}) {
      const scope = entities.length === 1 ? entities[0] : '*';
      let data = await this.request('/sync/bootstrap', {
        method: 'POST',
        body: JSON.stringify({ device_id: this.deviceId, entities, limit }),
      });
      let cursor = 0;
      let total = 0;

      while (true) {
        const changes = data.changes || [];
        await this.persistAndApplyChanges(changes);
        if (changes.length) await this.acknowledge(changes);

        cursor = data.next_cursor || cursor;
        total += changes.length;
        await this.adapter.setCursor(scope, cursor);

        emit('chatbot:sync-bootstrap-progress', {
          scope,
          sessionUuid: data.session_uuid,
          cursor,
          count: changes.length,
          total,
          hasMore: Boolean(data.has_more),
        });

        if (!data.has_more) break;

        const qs = new URLSearchParams({
          device_id: this.deviceId,
          cursor: String(cursor),
          limit: String(limit),
        });
        if (scope !== '*') qs.set('entities', scope);
        data = await this.request(`/sync/pull?${qs}`);
      }

      if (this.adapter.setBootstrapComplete) await this.adapter.setBootstrapComplete(scope, true);
      emit('chatbot:sync-bootstrap-complete', { scope, count: total, cursor });
      return { ...data, next_cursor: cursor, bootstrapped_count: total, has_more: false };
    }

    async sync({ entities = [], pushLimit = 100, pullLimit = 100, device = {} } = {}) {
      if (this.running) return { skipped: true, reason: 'already-running' };
      this.running = true;
      const network = this.networkProfile();
      if (network.weak) {
        pushLimit = Math.min(pushLimit, 20);
        pullLimit = Math.min(pullLimit, 25);
      }
      emit('chatbot:sync-started', { deviceId: this.deviceId, network });

      try {
        await this.ensureRegistered(device);
        const scopes = entities.length ? [...new Set(entities)] : ['*'];
        for (const scope of scopes) {
          const complete = this.adapter.isBootstrapComplete
            ? await this.adapter.isBootstrapComplete(scope)
            : (await this.adapter.getCursor(scope)) !== null;
          if (!complete) await this.bootstrap({ entities: scope === '*' ? [] : [scope], limit: pullLimit });
        }

        await this.push(pushLimit);
        const cursors = {};
        for (const scope of scopes) cursors[scope] = await this.pullScope(scope, pullLimit);

        const completedAt = new Date().toISOString();
        await this.adapter.setLastSuccessfulSync(completedAt);
        emit('chatbot:sync-complete', { cursors, completedAt, network });
        return { cursors, completedAt, network };
      } catch (error) {
        emit('chatbot:sync-failed', { error });
        throw error;
      } finally {
        this.running = false;
      }
    }

    async push(limit) {
      const queued = await this.adapter.getOutbox({ statuses: ['queued', 'failed'], limit });
      if (!queued.length) return { results: [] };
      const operationIds = queued.map(item => item.operation_uuid);
      await this.adapter.markOperations(operationIds, 'sending');

      try {
        const pushed = await this.request('/sync/push', {
          method: 'POST',
          body: JSON.stringify({ device_id: this.deviceId, operations: queued }),
        });
        for (const result of pushed.results) await this.adapter.applyPushResult(result);
        emit('chatbot:sync-push-complete', { results: pushed.results, summary: pushed.summary });
        return pushed;
      } catch (error) {
        await this.adapter.markOperations(operationIds, 'failed', {
          code: 'PUSH_TRANSPORT_FAILED',
          message: error.message,
        });
        throw error;
      }
    }

    async persistAndApplyChanges(changes) {
      if (!changes.length) return;
      if (this.adapter.storeInboxChanges) await this.adapter.storeInboxChanges(changes);
      const pending = this.adapter.getPendingInboxChanges
        ? await this.adapter.getPendingInboxChanges()
        : changes;
      await this.adapter.applyServerChanges(pending);
      if (this.adapter.markInboxChangesApplied) {
        await this.adapter.markInboxChangesApplied(pending.map(change => change.sync_sequence));
      }
    }

    async acknowledge(changes) {
      return this.request('/sync/acknowledge', {
        method: 'POST',
        body: JSON.stringify({
          device_id: this.deviceId,
          items: changes.map(change => ({
            sync_sequence: change.sync_sequence,
            entity_type: change.entity_type,
            server_entity_id: change.server_entity_id,
          })),
        }),
      });
    }

    async pullScope(scope, limit) {
      let cursor = (await this.adapter.getCursor(scope)) || 0;
      let hasMore = true;

      while (hasMore) {
        const qs = new URLSearchParams({
          device_id: this.deviceId,
          cursor: String(cursor),
          limit: String(limit),
        });
        if (scope !== '*') qs.set('entities', scope);

        const pulled = await this.request(`/sync/pull?${qs}`);
        await this.persistAndApplyChanges(pulled.changes);
        if (pulled.changes.length) await this.acknowledge(pulled.changes);

        cursor = pulled.next_cursor;
        hasMore = pulled.has_more;
        await this.adapter.setCursor(scope, cursor);
        emit('chatbot:sync-pull-progress', {
          scope,
          sessionUuid: pulled.session_uuid,
          cursor,
          count: pulled.changes.length,
          hasMore,
        });
      }

      return cursor;
    }
  }

  window.ChatbotSyncEngine = ChatbotSyncEngine;
  window.ChatbotSyncStatuses = STATUSES;
})();
