(() => {
  'use strict';

  function requireDeviceDb() {
    if (!window.TitanDeviceDB) throw new Error('TitanDeviceDB must load before the sync adapter.');
    return window.TitanDeviceDB;
  }

  class IndexedDbChatbotSyncAdapter {
    async getOutbox({ statuses = ['queued', 'failed'], limit = 100 } = {}) {
      const db = requireDeviceDb();
      return (await db.getAll('outbox'))
        .filter(row => statuses.includes(row.status))
        .sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')))
        .slice(0, limit);
    }

    async queue(operation) {
      const db = requireDeviceDb();
      const now = new Date().toISOString();
      const operationUuid = operation.operation_uuid || operation.id || crypto.randomUUID();
      const row = {
        ...operation,
        id: operationUuid,
        operation_uuid: operationUuid,
        idempotency_key: operation.idempotency_key || crypto.randomUUID(),
        status: operation.status || 'queued',
        created_at: operation.created_at || now,
        updated_at: now,
        retry_count: operation.retry_count || 0,
        next_attempt_at: operation.next_attempt_at || Date.now(),
      };
      await db.put('outbox', row);
      return row;
    }

    async markOperations(ids, status, error = null) {
      const db = requireDeviceDb();
      for (const id of ids) {
        const row = await db.get('outbox', id);
        if (!row) continue;
        await db.put('outbox', {
          ...row,
          status,
          last_error: error || row.last_error || null,
          updated_at: new Date().toISOString(),
        });
      }
    }

    async applyPushResult(result) {
      const db = requireDeviceDb();
      const row = await db.get('outbox', result.operation_uuid);
      if (row) {
        if (result.status === 'synced') await db.delete('outbox', result.operation_uuid);
        else await db.put('outbox', { ...row, status: result.status, result, updated_at: new Date().toISOString() });
      }
      if (result.record) {
        await db.put('syncRecords', {
          ...result.record,
          key: `${result.entity_type}:${result.local_entity_uuid}`,
          entity_type: result.entity_type,
          local_uuid: result.local_entity_uuid,
          server_id: result.server_entity_id,
          sync_status: 'synced',
        });
      }
    }

    async storeInboxChanges(changes = []) {
      const db = requireDeviceDb();
      for (const change of changes) await db.put('syncInbox', { ...change, status: 'pending' });
    }

    async getPendingInboxChanges() {
      return requireDeviceDb().getAllFromIndex('syncInbox', 'status', 'pending');
    }

    async markInboxChangesApplied(sequences = []) {
      const db = requireDeviceDb();
      for (const sequence of sequences) {
        const row = await db.get('syncInbox', sequence);
        if (row) await db.put('syncInbox', { ...row, status: 'applied', applied_at: new Date().toISOString() });
      }
    }

    async applyServerChanges(changes = []) {
      const db = requireDeviceDb();
      for (const change of changes) {
        const localUuid = change.local_uuid || change.server_entity_id;
        const key = `${change.entity_type}:${localUuid}`;
        if (change.change_type === 'delete') {
          await db.put('syncRecords', {
            key,
            entity_type: change.entity_type,
            local_uuid: localUuid,
            server_id: change.server_entity_id,
            version: change.version,
            deleted_at: change.changed_at,
            sync_status: 'deleted-remotely',
          });
        } else {
          await db.put('syncRecords', {
            ...(change.record || {}),
            key,
            entity_type: change.entity_type,
            local_uuid: localUuid,
            server_id: change.server_entity_id,
            version: change.version,
            sync_status: 'synced',
            last_synced_at: change.changed_at,
          });
        }
      }
    }

    async getCursor(entity = '*') {
      return (await requireDeviceDb().get('metadata', `cursor:${entity}`))?.value ?? null;
    }

    async setCursor(entity, value) {
      await requireDeviceDb().put('metadata', { key: `cursor:${entity}`, value, updated_at: new Date().toISOString() });
    }

    async isBootstrapComplete(entity = '*') {
      return Boolean((await requireDeviceDb().get('metadata', `bootstrap:${entity}`))?.value);
    }

    async setBootstrapComplete(entity, value) {
      await requireDeviceDb().put('metadata', { key: `bootstrap:${entity}`, value: Boolean(value), updated_at: new Date().toISOString() });
    }

    async setLastSuccessfulSync(value) {
      await requireDeviceDb().put('metadata', { key: 'last_successful_sync', value, updated_at: value });
    }
  }

  window.IndexedDbChatbotSyncAdapter = IndexedDbChatbotSyncAdapter;
})();
