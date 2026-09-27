(() => {
  const root = window.TitanWorkCore = window.TitanWorkCore || {};
  const C = root.contracts;
  if (!C) throw new Error('Titan WorkCore contracts must load before database.js');

  const request = req => new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB request failed'));
  });
  const transactionDone = tx => new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
    tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
  });

  function upgrade(db, tx) {
    const ensure = (name, options, indexes = []) => {
      const store = db.objectStoreNames.contains(name) ? tx.objectStore(name) : db.createObjectStore(name, options);
      for (const [indexName, keyPath, indexOptions] of indexes) {
        if (!store.indexNames.contains(indexName)) store.createIndex(indexName, keyPath, indexOptions);
      }
    };
    ensure(C.stores.meta, { keyPath: 'key' });
    ensure(C.stores.records, { keyPath: 'key' }, [
      ['by_type','type'], ['by_company','company_id'], ['by_updated','updated_at']
    ]);
    ensure(C.stores.jobPacks, { keyPath: 'id' }, [
      ['by_company','company_id'], ['by_schedule','scheduled_at'], ['by_expiry','expires_at']
    ]);
    ensure(C.stores.drafts, { keyPath: 'id' }, [['by_resource','resource_key'], ['by_updated','updated_at']]);
    ensure(C.stores.outbox, { keyPath: 'operation_id' }, [
      ['by_state','state'], ['by_available','available_at'], ['by_company','company_id'], ['by_resource','resource_key']
    ]);
    ensure(C.stores.conflicts, { keyPath: 'id' }, [['by_operation','operation_id'], ['by_status','status']]);
    ensure(C.stores.uploadSessions, { keyPath: 'attachment_id' }, [['by_state','state'], ['by_updated','updated_at']]);
    ensure(C.stores.tombstones, { keyPath: 'key' }, [['by_type','type'], ['by_deleted','deleted_at']]);
    ensure(C.stores.attachments, { keyPath: 'id' }, [['by_operation','operation_id'], ['by_state','state'], ['by_checksum','checksum'], ['by_pack','pack_id'], ['by_updated','updated_at']]);
    ensure(C.stores.attachmentChunks, { keyPath: 'key' }, [['by_attachment','attachment_id'], ['by_state','state']]);
    ensure(C.stores.knowledgeArticles, { keyPath: 'id' }, [['by_category','category_id'], ['by_role','role_key'], ['by_version','version'], ['by_updated','updated_at'], ['by_favourite','is_favourite']]);
    ensure(C.stores.knowledgeMedia, { keyPath: 'id' }, [['by_article','article_id'], ['by_checksum','checksum']]);
    ensure(C.stores.offlinePacks, { keyPath: 'id' }, [['by_type','type'], ['by_status','status'], ['by_expiry','expires_at'], ['by_updated','updated_at']]);
    ensure(C.stores.syncLog, { keyPath: 'id', autoIncrement: true }, [['by_created','created_at'], ['by_level','level']]);
  }

  let dbPromise;
  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(C.database.name, C.database.version);
      req.onupgradeneeded = event => upgrade(req.result, req.transaction, event.oldVersion);
      req.onsuccess = () => { const db=req.result; db.onversionchange=()=>{ db.close(); dbPromise=null; window.dispatchEvent(new CustomEvent('workcore:database-versionchange')); }; resolve(db); };
      req.onerror = () => reject(req.error);
      req.onblocked = () => window.dispatchEvent(new CustomEvent('workcore:database-blocked'));
    });
    return dbPromise;
  }

  async function withStore(storeName, mode, fn) {
    const db = await open();
    const tx = db.transaction(storeName, mode);
    const done = transactionDone(tx);
    const result = await fn(tx.objectStore(storeName), tx);
    await done;
    return result;
  }
  async function put(store, value) { return withStore(store, 'readwrite', objectStore => request(objectStore.put(value))); }
  async function get(store, key) { return withStore(store, 'readonly', objectStore => request(objectStore.get(key))); }
  async function remove(store, key) { return withStore(store, 'readwrite', objectStore => request(objectStore.delete(key))); }
  async function all(store) { return withStore(store, 'readonly', objectStore => request(objectStore.getAll())); }
  async function byIndex(store, index, value) { return withStore(store, 'readonly', objectStore => request(objectStore.index(index).getAll(value))); }
  async function clear(store) { return withStore(store, 'readwrite', objectStore => request(objectStore.clear())); }
  async function setMeta(key, value) { return put(C.stores.meta, { key, value, updated_at: new Date().toISOString() }); }
  async function getMeta(key, fallback = null) { const row = await get(C.stores.meta, key); return row ? row.value : fallback; }

  async function reset() {
    if (dbPromise) { const db = await dbPromise; db.close(); dbPromise = null; }
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase(C.database.name);
      req.onsuccess = resolve; req.onerror = () => reject(req.error); req.onblocked = resolve;
    });
  }

  root.db = { open, put, get, remove, all, byIndex, clear, setMeta, getMeta, reset };
})();
