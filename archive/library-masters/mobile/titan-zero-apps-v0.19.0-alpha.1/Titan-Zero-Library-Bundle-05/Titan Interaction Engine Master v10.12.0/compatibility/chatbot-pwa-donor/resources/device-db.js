(() => {
  'use strict';

  const DB_NAME = 'titan-chatbot-device';
  const DB_VERSION = 5;
  const STORES = {
    conversations: { keyPath: 'id', indexes: [['server_id', 'server_id'], ['tenant_id', 'tenant_id'], ['chatbot_id', 'chatbot_id'], ['sync_status', 'sync_status'], ['updated_at', 'updated_at'], ['search_text', 'search_text'], ['conversation_type', 'conversation_type'], ['linked_entity_type', 'linked_entity_type'], ['slug', 'slug']] },
    messages: { keyPath: 'id', indexes: [['server_id', 'server_id'], ['conversation_uuid', 'conversation_uuid'], ['sync_status', 'sync_status'], ['created_at', 'created_at'], ['search_text', 'search_text']] },
    drafts: { keyPath: 'id', indexes: [['conversation_uuid', 'conversation_uuid'], ['updated_at', 'updated_at'], ['search_text', 'search_text']] },
    participants: { keyPath: 'id', indexes: [['server_id', 'server_id'], ['conversation_uuid', 'conversation_uuid'], ['tenant_id', 'tenant_id']] },
    customerSummaries: { keyPath: 'id', indexes: [['server_id', 'server_id'], ['tenant_id', 'tenant_id'], ['search_text', 'search_text'], ['updated_at', 'updated_at']] },
    attachments: { keyPath: 'id', indexes: [['server_id', 'server_id'], ['conversation_uuid', 'conversation_uuid'], ['message_uuid', 'message_uuid'], ['sync_status', 'sync_status']] },
    reviews: { keyPath: 'id', indexes: [['server_id', 'server_id'], ['conversation_uuid', 'conversation_uuid'], ['sync_status', 'sync_status'], ['created_at', 'created_at']] },
    supportRequests: { keyPath: 'id', indexes: [['server_id', 'server_id'], ['conversation_uuid', 'conversation_uuid'], ['sync_status', 'sync_status'], ['created_at', 'created_at']] },
    cannedResponses: { keyPath: 'id', indexes: [['server_id', 'server_id'], ['tenant_id', 'tenant_id'], ['search_text', 'search_text']] },
    knowledgeArticles: { keyPath: 'id', indexes: [['server_id', 'server_id'], ['tenant_id', 'tenant_id'], ['search_text', 'search_text'], ['updated_at', 'updated_at']] },
    outbox: { keyPath: 'id', indexes: [['status', 'status'], ['entity_type', 'entity_type'], ['local_entity_uuid', 'local_entity_uuid'], ['next_attempt_at', 'next_attempt_at'], ['created_at', 'created_at']] },
    metadata: { keyPath: 'key', indexes: [] },
    conflicts: { keyPath: 'id', indexes: [['status', 'status'], ['entity_type', 'entity_type'], ['created_at', 'created_at']] },
    uiState: { keyPath: 'id', indexes: [['message_id', 'message_id'], ['conversation_id', 'conversation_id'], ['updated_at', 'updated_at']] },
    syncRecords: { keyPath: 'key', indexes: [['entity_type', 'entity_type'], ['local_uuid', 'local_uuid'], ['server_id', 'server_id'], ['sync_status', 'sync_status']] },
    syncInbox: { keyPath: 'sync_sequence', indexes: [['status', 'status'], ['entity_type', 'entity_type']] }
  };

  let dbPromise;

  function migrateLegacyRecord(storeName, cursor) {
    const value = cursor.value || {};
    const localUuid = value.local_uuid || value.id || crypto.randomUUID();
    const patch = { ...value, id: value.id || localUuid, local_uuid: localUuid };
    if (storeName === 'conversations') {
      patch.chatbot_id = value.chatbot_id ?? value.chatbotId ?? null;
      patch.updated_at = value.updated_at ?? value.updatedAt ?? Date.now();
      patch.sync_status = value.sync_status ?? value.status ?? 'local-only';
    } else if (storeName === 'messages') {
      patch.conversation_uuid = value.conversation_uuid ?? value.conversationId ?? null;
      patch.created_at = value.created_at ?? value.createdAt ?? Date.now();
      patch.sync_status = value.sync_status ?? value.status ?? 'local-only';
    } else if (storeName === 'drafts') {
      patch.conversation_uuid = value.conversation_uuid ?? value.conversationId ?? null;
      patch.updated_at = value.updated_at ?? value.updatedAt ?? Date.now();
    } else if (storeName === 'attachments') {
      patch.conversation_uuid = value.conversation_uuid ?? value.conversationId ?? null;
      patch.sync_status = value.sync_status ?? value.status ?? 'local-only';
    } else if (storeName === 'outbox') {
      patch.operation_uuid = value.operation_uuid || value.id || localUuid;
      patch.id = value.id || patch.operation_uuid;
      patch.local_entity_uuid = value.local_entity_uuid || value.entityId || null;
      patch.next_attempt_at = value.next_attempt_at ?? value.nextAttemptAt ?? 0;
      patch.created_at = value.created_at ?? value.createdAt ?? Date.now();
    } else if (storeName === 'conflicts') {
      patch.local_uuid = localUuid;
      patch.created_at = value.created_at ?? value.createdAt ?? Date.now();
    }
    cursor.update(patch);
  }

  function ensureStore(db, transaction, name, definition) {
    const store = db.objectStoreNames.contains(name)
      ? transaction.objectStore(name)
      : db.createObjectStore(name, { keyPath: definition.keyPath });
    definition.indexes.forEach(([indexName, keyPath]) => {
      if (!store.indexNames.contains(indexName)) store.createIndex(indexName, keyPath, { unique: false });
    });
    return store;
  }

  function open() {
    if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB is unavailable.'));
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = event => {
        const db = request.result;
        const tx = request.transaction;
        Object.entries(STORES).forEach(([name, definition]) => ensureStore(db, tx, name, definition));
        if (event.oldVersion < 2) {
          ['conversations', 'messages', 'drafts', 'attachments', 'outbox', 'conflicts'].forEach(name => {
            if (!db.objectStoreNames.contains(name)) return;
            tx.objectStore(name).openCursor().onsuccess = cursorEvent => {
              const cursor = cursorEvent.target.result;
              if (!cursor) return;
              migrateLegacyRecord(name, cursor);
              cursor.continue();
            };
          });
        }
        if (event.oldVersion < 4 && db.objectStoreNames.contains('conversations')) {
          tx.objectStore('conversations').openCursor().onsuccess = cursorEvent => {
            const cursor = cursorEvent.target.result;
            if (!cursor) return;
            const value = cursor.value || {};
            cursor.update({
              ...value,
              conversation_type: value.conversation_type || value.type || value.channel || 'customer',
              linked_entity_type: value.linked_entity_type || null,
              linked_entity_id: value.linked_entity_id || null,
              slug: value.slug || null,
              archived: Boolean(value.archived),
              pinned: Boolean(value.pinned),
            });
            cursor.continue();
          };
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Unable to open device database.'));
      request.onblocked = () => console.warn('Titan device database upgrade is blocked by another tab.');
    });
    return dbPromise;
  }

  async function runRequest(storeName, mode, operation) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      let request;
      try { request = operation(store); } catch (error) { reject(error); return; }
      tx.oncomplete = () => resolve(request?.result);
      tx.onerror = () => reject(tx.error || request?.error || new Error('Database transaction failed.'));
      tx.onabort = () => reject(tx.error || new Error('Database transaction aborted.'));
    });
  }

  async function getAllFromIndex(storeName, indexName, value) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(storeName, 'readonly').objectStore(storeName).index(indexName).getAll(value);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function page(storeName, { index, value, offset = 0, limit = 30, direction = 'prev' } = {}) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const output = [];
      const store = db.transaction(storeName, 'readonly').objectStore(storeName);
      const source = index ? store.index(index) : store;
      const range = value === undefined ? null : IDBKeyRange.only(value);
      let skipped = 0;
      const req = source.openCursor(range, direction);
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor || output.length >= limit) return resolve(output);
        if (skipped++ < offset) { cursor.continue(); return; }
        output.push(cursor.value);
        cursor.continue();
      };
      req.onerror = () => reject(req.error);
    });
  }

  window.TitanDeviceDB = {
    name: DB_NAME,
    version: DB_VERSION,
    stores: Object.freeze(Object.keys(STORES)),
    open,
    put: (store, value) => runRequest(store, 'readwrite', objectStore => objectStore.put(value)),
    add: (store, value) => runRequest(store, 'readwrite', objectStore => objectStore.add(value)),
    get: (store, key) => runRequest(store, 'readonly', objectStore => objectStore.get(key)),
    delete: (store, key) => runRequest(store, 'readwrite', objectStore => objectStore.delete(key)),
    clear: store => runRequest(store, 'readwrite', objectStore => objectStore.clear()),
    getAll: store => runRequest(store, 'readonly', objectStore => objectStore.getAll()),
    getAllFromIndex,
    count: store => runRequest(store, 'readonly', objectStore => objectStore.count()),
    page,
    transaction: async (storeNames, mode, callback) => {
      const db = await open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeNames, mode);
        const stores = Object.fromEntries(storeNames.map(name => [name, tx.objectStore(name)]));
        let output;
        try { output = callback(stores, tx); } catch (error) { tx.abort(); reject(error); return; }
        tx.oncomplete = () => resolve(output);
        tx.onerror = () => reject(tx.error || new Error('Database transaction failed.'));
        tx.onabort = () => reject(tx.error || new Error('Database transaction aborted.'));
      });
    }
  };
})();
