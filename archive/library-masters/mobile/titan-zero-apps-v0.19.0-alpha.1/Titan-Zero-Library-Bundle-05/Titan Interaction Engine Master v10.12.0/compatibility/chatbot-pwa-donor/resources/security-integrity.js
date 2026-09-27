(() => {
  'use strict';

  const root = window.chatbotPwa = window.chatbotPwa || {};
  const DB_NAME = 'chatbot-pwa';
  const DB_VERSION = 8;
  const STORES = Object.freeze({
    tasks: 'tasks', conflicts: 'conflicts', audit: 'audit', identity: 'identity',
    permissions: 'permissions', vault: 'vault', meta: 'meta', backups: 'backups', quarantine: 'quarantine'
  });
  const SHARED_STATUSES = Object.freeze(['local-only','queued','sending','synced','failed','needs-review','conflict','cancelled','deleted-locally','deleted-remotely']);
  const SHARED_STATUS_SET = new Set(SHARED_STATUSES);
  const SHARED_RECORD_FIELDS = Object.freeze(['local_uuid','server_id','tenant_id','user_id','device_id','entity_type','version','sync_sequence','sync_status','created_at','updated_at','deleted_at','last_synced_at']);
  const OPERATION_FIELDS = Object.freeze(['operation_uuid','idempotency_key','entity_type','local_entity_uuid','server_entity_id','action','expected_version','payload','dependencies','created_at','retry_count','status','last_error']);
  const HIGH_RISK = new Set(['payment.capture','payment.refund','invoice.mark_paid','quote.accept','assignment.override','permission.change']);
  const MANUAL_ENTITIES = new Set(['customer','conversation_ownership','booking','assignment','quote','invoice','payment']);
  const APPEND_ONLY = new Set(['message','note','attachment','timeline_event']);
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const listeners = (name, detail = {}) => window.dispatchEvent(new CustomEvent(name, { detail }));
  const now = () => new Date().toISOString();
  const uuid = () => crypto.randomUUID();
  const b64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
  const unb64 = text => Uint8Array.from(atob(text), c => c.charCodeAt(0));
  const hex = bytes => [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');

  let dbPromise;
  let vaultKey = null;
  let autoLockTimer = null;
  let failedUnlocks = 0;
  let lockoutUntil = 0;
  const SECURITY_CHANNEL = 'chatbot-pwa-security-v1';
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel(SECURITY_CHANNEL) : null;
  const tabId = uuid();
  let applyingRemoteSignal = false;
  let auditQueue = Promise.resolve();

  function request(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function txDone(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onabort = tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
    });
  }

  function ensureStore(db, tx, name, options, indexes = []) {
    const store = db.objectStoreNames.contains(name) ? tx.objectStore(name) : db.createObjectStore(name, options);
    for (const [indexName, keyPath, unique = false] of indexes) {
      if (!store.indexNames.contains(indexName)) store.createIndex(indexName, keyPath, { unique });
    }
    return store;
  }

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = event => {
        const db = req.result;
        const tx = req.transaction;
        const old = event.oldVersion;
        ensureStore(db, tx, STORES.tasks, { keyPath: 'id' }, [['status','status'],['createdAt','createdAt']]);
        ensureStore(db, tx, STORES.conflicts, { keyPath: 'conflict_uuid' }, [['status','status'],['entity_type','entity_type'],['created_at','created_at']]);
        ensureStore(db, tx, STORES.audit, { keyPath: 'audit_uuid' }, [['event_type','event_type'],['created_at','created_at'],['entity_type','entity_type']]);
        ensureStore(db, tx, STORES.identity, { keyPath: 'key' });
        ensureStore(db, tx, STORES.permissions, { keyPath: 'key' });
        ensureStore(db, tx, STORES.vault, { keyPath: 'key' });
        ensureStore(db, tx, STORES.meta, { keyPath: 'key' });
        ensureStore(db, tx, STORES.backups, { keyPath: 'backup_uuid' }, [['created_at','created_at']]);
        ensureStore(db, tx, STORES.quarantine, { keyPath: 'quarantine_uuid' }, [['store','store'],['created_at','created_at']]);
        tx.objectStore(STORES.meta).put({ key: `migration:${old}:${DB_VERSION}`, from: old, to: DB_VERSION, status: 'completed', steps: ['ensure-core-stores','ensure-indexes','add-quarantine-store','add-audit-chain','add-cross-tab-security','freeze-shared-contracts','bind-permission-snapshot-identity','vault-integrity-and-atomic-rotation','lifecycle-audit-hooks','protected-reset-token'], at: now() });
        tx.objectStore(STORES.meta).put({ key: 'migration_checkpoint', from: old, to: DB_VERSION, status: 'completed', at: now() });
        tx.objectStore(STORES.meta).put({ key: 'schema_version', value: DB_VERSION, at: now() });
      };
      req.onsuccess = () => {
        const db = req.result;
        db.onversionchange = () => { db.close(); dbPromise = null; };
        resolve(db);
      };
      req.onerror = () => reject(req.error);
      req.onblocked = () => listeners('chatbot:pwa-migration-blocked');
    });
    return dbPromise;
  }

  async function put(storeName, value) {
    const db = await openDb();
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(value);
    await txDone(tx);
    return value;
  }
  async function get(storeName, key) {
    const db = await openDb();
    return request(db.transaction(storeName).objectStore(storeName).get(key));
  }
  async function all(storeName) {
    const db = await openDb();
    return request(db.transaction(storeName).objectStore(storeName).getAll());
  }
  async function remove(storeName, key) {
    const db = await openDb();
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(key);
    await txDone(tx);
  }

  function stableJson(value) {
    if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
    if (value && typeof value === 'object') {
      return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
    }
    return JSON.stringify(value);
  }

  async function sha256(value) {
    return hex(await crypto.subtle.digest('SHA-256', enc.encode(value)));
  }

  async function writeAuditEntry(eventType, detail = {}) {
    const identity = await get(STORES.identity, 'session').catch(() => null);
    const head = await get(STORES.meta, 'audit_chain_head').catch(() => null);
    const entry = {
      audit_uuid: uuid(), sequence:(head?.sequence || 0) + 1, event_type:eventType,
      entity_type:detail.entity_type || null, entity_uuid:detail.entity_uuid || null,
      tenant_id:detail.tenant_id || identity?.tenant_id || null,
      user_id:detail.user_id || identity?.user_id || null,
      device_id:detail.device_id || identity?.device_id || null,
      detail:redact(detail), created_at:now(), previous_hash:head?.hash || null
    };
    entry.hash = await sha256(stableJson({ ...entry, hash: undefined }));
    const db = await openDb();
    const tx = db.transaction([STORES.audit, STORES.meta], 'readwrite');
    tx.objectStore(STORES.audit).put(entry);
    tx.objectStore(STORES.meta).put({ key:'audit_chain_head', hash:entry.hash, audit_uuid:entry.audit_uuid, sequence:entry.sequence, updated_at:entry.created_at });
    await txDone(tx);
    listeners('chatbot:pwa-audit', { entry });
    return entry;
  }

  async function audit(eventType, detail = {}) {
    const execute = () => writeAuditEntry(eventType, detail);
    if (navigator.locks?.request) return navigator.locks.request('chatbot-pwa-audit-chain', execute);
    const pending = auditQueue.then(execute, execute);
    auditQueue = pending.catch(() => undefined);
    return pending;
  }

  async function verifyAuditChain() {
    const entries = (await all(STORES.audit)).sort((a, b) => (a.sequence || 0) - (b.sequence || 0) || String(a.created_at).localeCompare(String(b.created_at)));
    let previous = null;
    let sequence = 0;
    const issues = [];
    for (const entry of entries) {
      if (entry.sequence !== sequence + 1) issues.push({ type:'audit-sequence-gap', audit_uuid:entry.audit_uuid, expected:sequence + 1, actual:entry.sequence });
      if (entry.previous_hash !== previous) issues.push({ type:'audit-chain-link-mismatch', audit_uuid:entry.audit_uuid });
      const expected = await sha256(stableJson({ ...entry, hash: undefined }));
      if (entry.hash !== expected) issues.push({ type:'audit-entry-hash-mismatch', audit_uuid:entry.audit_uuid });
      previous = entry.hash || null;
      sequence = entry.sequence || sequence + 1;
    }
    const head = await get(STORES.meta, 'audit_chain_head').catch(() => null);
    if ((head?.hash || null) !== previous) issues.push({ type:'audit-chain-head-mismatch', audit_uuid:head?.audit_uuid || null });
    return { healthy:issues.length === 0, count:entries.length, issues, head:previous };
  }

  function redact(value) {
    const forbidden = /password|pin|secret|token|key|authorization|credential/i;
    if (Array.isArray(value)) return value.map(redact);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, forbidden.test(k) ? '[REDACTED]' : redact(v)]));
  }

  function validateSharedRecord(record, options = {}) {
    const errors = [];
    if (!record || typeof record !== 'object' || Array.isArray(record)) return { valid:false, errors:['record-must-be-an-object'] };
    const required = options.allow_partial ? ['local_uuid','tenant_id','user_id','device_id','entity_type','sync_status'] : SHARED_RECORD_FIELDS;
    for (const field of required) if (!(field in record)) errors.push(`missing:${field}`);
    if (record.sync_status != null && !SHARED_STATUS_SET.has(record.sync_status)) errors.push(`invalid-status:${record.sync_status}`);
    if (record.version != null && (!Number.isInteger(record.version) || record.version < 0)) errors.push('invalid:version');
    if (record.sync_sequence != null && (!Number.isInteger(record.sync_sequence) || record.sync_sequence < 0)) errors.push('invalid:sync_sequence');
    for (const field of ['local_uuid','tenant_id','user_id','device_id','entity_type']) if (record[field] != null && String(record[field]).trim() === '') errors.push(`blank:${field}`);
    return { valid:errors.length === 0, errors };
  }

  function validateOperationEnvelope(operation) {
    const errors = [];
    if (!operation || typeof operation !== 'object' || Array.isArray(operation)) return { valid:false, errors:['operation-must-be-an-object'] };
    for (const field of OPERATION_FIELDS) if (!(field in operation)) errors.push(`missing:${field}`);
    if (operation.status != null && !SHARED_STATUS_SET.has(operation.status)) errors.push(`invalid-status:${operation.status}`);
    if (!Array.isArray(operation.dependencies)) errors.push('invalid:dependencies');
    if (operation.retry_count != null && (!Number.isInteger(operation.retry_count) || operation.retry_count < 0)) errors.push('invalid:retry_count');
    if (operation.payload != null && (typeof operation.payload !== 'object' || Array.isArray(operation.payload))) errors.push('invalid:payload');
    for (const field of ['operation_uuid','idempotency_key','entity_type','local_entity_uuid','action']) if (operation[field] != null && String(operation[field]).trim() === '') errors.push(`blank:${field}`);
    return { valid:errors.length === 0, errors };
  }

  function assertPermissionContext(session, snapshot) {
    if (!session || !snapshot) return { valid:false, reason:'missing-security-context' };
    for (const field of ['tenant_id','user_id','device_id']) {
      if (snapshot[field] == null || session[field] == null || String(snapshot[field]) !== String(session[field])) return { valid:false, reason:`${field}-mismatch` };
    }
    return { valid:true, reason:null };
  }

  function changedFields(local = {}, server = {}) {
    const ignored = new Set(['version','sync_status','last_synced_at','updated_at']);
    return [...new Set([...Object.keys(local), ...Object.keys(server)])]
      .filter(k => !ignored.has(k) && JSON.stringify(local[k]) !== JSON.stringify(server[k]));
  }

  function classifyConflict(input) {
    const { entity_type, local = {}, server = {}, operation = {} } = input;
    let type = 'concurrent-edit';
    if (server.deleted_at && !local.deleted_at) type = 'local-edit-after-remote-deletion';
    else if (local.deleted_at && !server.deleted_at) type = 'remote-edit-after-local-deletion';
    else if (!local.server_id && server.server_id && local.local_uuid === server.local_uuid) type = 'duplicate-local-creation';
    else if (operation.expected_version != null && server.version != null && operation.expected_version !== server.version) type = 'version-mismatch';
    else if (operation.dependencies?.some(d => d.status && d.status !== 'synced')) type = 'invalid-operation-dependency';
    else if (input.permission_denied) type = 'permission-conflict';
    else if (entity_type === 'assignment' && local.assignee_id !== server.assignee_id) type = 'assignment-conflict';
    const fields = changedFields(local, server);
    return {
      type, fields,
      strategy: APPEND_ONLY.has(entity_type) ? 'automatic-append' : MANUAL_ENTITIES.has(entity_type) ? 'manual-review' : 'field-merge',
      high_risk: MANUAL_ENTITIES.has(entity_type)
    };
  }

  async function createConflict(input) {
    const classification = classifyConflict(input);
    const conflict = {
      conflict_uuid: input.conflict_uuid || uuid(), entity_type: input.entity_type,
      entity_uuid: input.entity_uuid || input.local?.local_uuid || null,
      record_name: input.record_name || input.local?.name || input.server?.name || 'Unnamed record',
      local_version: input.local || {}, server_version: input.server || {}, changed_fields: classification.fields,
      classification: classification.type, strategy: classification.strategy, high_risk: classification.high_risk,
      local_actor: input.local_actor || null, server_actor: input.server_actor || null,
      status: classification.strategy === 'automatic-append' ? 'auto-merge-pending' : 'open',
      created_at: now(), updated_at: now(), resolution: null, resolution_history: []
    };
    await put(STORES.conflicts, conflict);
    await audit('conflict.created', { entity_type: conflict.entity_type, entity_uuid: conflict.entity_uuid, classification: conflict.classification });
    listeners('chatbot:pwa-conflict-created', { conflict });
    if (classification.strategy === 'automatic-append') return resolveConflict(conflict.conflict_uuid, 'merge', { automatic: true });
    renderConflictCentre();
    return conflict;
  }

  function mergeSelected(local, server, selected = {}) {
    const result = { ...server };
    for (const [field, source] of Object.entries(selected)) result[field] = source === 'local' ? local[field] : server[field];
    return result;
  }

  function mergeAppendOnly(local = {}, server = {}) {
    const result = { ...server, ...local };
    for (const field of new Set([...Object.keys(local), ...Object.keys(server)])) {
      if (Array.isArray(local[field]) || Array.isArray(server[field])) {
        const seen = new Set();
        result[field] = [...(server[field] || []), ...(local[field] || [])].filter(item => {
          const key = typeof item === 'object' ? JSON.stringify(item) : String(item);
          if (seen.has(key)) return false;
          seen.add(key); return true;
        });
      }
    }
    result.version = Math.max(local.version || 0, server.version || 0);
    result.sync_status = 'needs-review';
    return result;
  }

  async function resolveConflict(id, action, options = {}) {
    const conflict = await get(STORES.conflicts, id);
    if (!conflict) throw new Error('Conflict not found');
    let canonical;
    if (action === 'keep-local') canonical = conflict.local_version;
    else if (action === 'keep-server') canonical = conflict.server_version;
    else if (action === 'merge') canonical = options.automatic
      ? mergeAppendOnly(conflict.local_version, conflict.server_version)
      : mergeSelected(conflict.local_version, conflict.server_version, options.selected_fields || {});
    else throw new TypeError('Unknown conflict resolution action');
    const resolution = { action, canonical, selected_fields: options.selected_fields || null, automatic: !!options.automatic, at: now() };
    conflict.status = 'resolved'; conflict.resolution = resolution; conflict.updated_at = now();
    conflict.resolution_history.push(resolution);
    await put(STORES.conflicts, conflict);
    await audit('conflict.resolved', { entity_type: conflict.entity_type, entity_uuid: conflict.entity_uuid, action, automatic: !!options.automatic });
    listeners('chatbot:pwa-conflict-resolved', { conflict, canonical, retry: true });
    renderConflictCentre();
    return { conflict, canonical, retry: true };
  }

  async function deriveKey(pin, salt, iterations = 310000) {
    const material = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name:'PBKDF2', salt, iterations, hash:'SHA-256' }, material, { name:'AES-GCM', length:256 }, false, ['encrypt','decrypt']);
  }
  async function encryptWith(key, value) {
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const cipher = await crypto.subtle.encrypt({ name:'AES-GCM', iv:nonce }, key, enc.encode(JSON.stringify(value)));
    return { nonce:b64(nonce), cipher:b64(cipher), algorithm:'AES-256-GCM', v:1 };
  }
  async function decryptWith(key, item) {
    const plain = await crypto.subtle.decrypt({ name:'AES-GCM', iv:unb64(item.nonce) }, key, unb64(item.cipher));
    return JSON.parse(dec.decode(plain));
  }

  function resetAutoLock(minutes) {
    clearTimeout(autoLockTimer);
    if (!vaultKey || !minutes) return;
    autoLockTimer = setTimeout(() => lockVault('inactivity'), minutes * 60000);
  }

  async function initialiseVault(pin, options = {}) {
    if (!/^\d{4,12}$/.test(pin)) throw new TypeError('PIN must contain 4–12 digits');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(pin, salt);
    const verifier = await encryptWith(key, { marker:'titan-chatbot-vault', created_at:now() });
    await put(STORES.meta, { key:'vault_config', salt:b64(salt), iterations:310000, auto_lock_minutes:options.auto_lock_minutes || 5, created_at:now() });
    await put(STORES.vault, { key:'__verifier__', ...verifier });
    vaultKey = key; failedUnlocks = 0;
    resetAutoLock(options.auto_lock_minutes || 5);
    await audit('vault.initialised');
    return true;
  }

  async function unlockVault(pin) {
    const persisted = await get(STORES.meta, 'unlock_security').catch(() => null);
    lockoutUntil = Math.max(lockoutUntil, persisted?.lockout_until || 0);
    failedUnlocks = Math.max(failedUnlocks, persisted?.failed_unlocks || 0);
    if (Date.now() < lockoutUntil) throw new Error(`Vault locked until ${new Date(lockoutUntil).toISOString()}`);
    const config = await get(STORES.meta, 'vault_config');
    const verifier = await get(STORES.vault, '__verifier__');
    if (!config || !verifier) throw new Error('Vault has not been initialised');
    try {
      const key = await deriveKey(pin, unb64(config.salt), config.iterations);
      const marker = await decryptWith(key, verifier);
      if (marker.marker !== 'titan-chatbot-vault') throw new Error('Invalid vault marker');
      vaultKey = key; failedUnlocks = 0; lockoutUntil = 0;
      await put(STORES.meta, { key:'unlock_security', failed_unlocks:0, lockout_until:0, updated_at:now() });
      resetAutoLock(config.auto_lock_minutes || 5);
      await audit('vault.unlocked');
      listeners('chatbot:pwa-vault-unlocked');
      return true;
    } catch (error) {
      failedUnlocks += 1;
      if (failedUnlocks >= 5) { lockoutUntil = Date.now() + 15 * 60000; failedUnlocks = 0; }
      await put(STORES.meta, { key:'unlock_security', failed_unlocks:failedUnlocks, lockout_until:lockoutUntil, updated_at:now() });
      await audit('vault.unlock_failed', { attempts_before_lockout: 5, locked: lockoutUntil > Date.now() });
      throw new Error('Invalid PIN or corrupted vault');
    }
  }

  async function lockVault(reason = 'manual', options = {}) {
    vaultKey = null; clearTimeout(autoLockTimer);
    await audit('vault.locked', { reason, remote:!!options.remote });
    listeners('chatbot:pwa-vault-locked', { reason, remote:!!options.remote });
    if (!options.remote && channel) channel.postMessage({ type:'lock', reason, source:tabId, at:Date.now() });
  }

  async function vaultSet(key, value) {
    if (!vaultKey) throw new Error('Vault is locked');
    resetAutoLock((await get(STORES.meta, 'vault_config'))?.auto_lock_minutes || 5);
    return put(STORES.vault, { key, ...(await encryptWith(vaultKey, value)), updated_at:now() });
  }
  async function vaultGet(key) {
    if (!vaultKey) throw new Error('Vault is locked');
    const item = await get(STORES.vault, key);
    if (!item) return null;
    return decryptWith(vaultKey, item);
  }

  async function verifyVaultIntegrity() {
    const config = await get(STORES.meta, 'vault_config').catch(() => null);
    const records = await all(STORES.vault);
    const issues = [];
    if (!config && records.length) issues.push({ type:'vault-config-missing' });
    for (const item of records) {
      if (!item.key || !item.nonce || !item.cipher || item.algorithm !== 'AES-256-GCM') {
        issues.push({ type:'vault-record-format-invalid', key:item.key || null });
        continue;
      }
      if (vaultKey) {
        try { await decryptWith(vaultKey, item); }
        catch { issues.push({ type:'vault-record-corrupt', key:item.key }); }
      }
    }
    return { healthy:issues.length === 0, locked:!vaultKey, checked_records:records.length, issues };
  }

  async function rotateVaultKey(oldPin, newPin) {
    if (!/^\d{4,12}$/.test(newPin)) throw new TypeError('PIN must contain 4–12 digits');
    await unlockVault(oldPin);
    const oldConfig = await get(STORES.meta, 'vault_config');
    const records = (await all(STORES.vault)).filter(x => x.key !== '__verifier__');
    const plain = [];
    for (const item of records) plain.push([item.key, await decryptWith(vaultKey, item)]);
    const newSalt = crypto.getRandomValues(new Uint8Array(16));
    const newKey = await deriveKey(newPin, newSalt, 310000);
    const verifier = await encryptWith(newKey, { marker:'titan-chatbot-vault', rotated_at:now() });
    const encrypted = [];
    for (const [key, value] of plain) encrypted.push({ key, ...(await encryptWith(newKey, value)), updated_at:now() });
    const db = await openDb();
    const tx = db.transaction([STORES.vault, STORES.meta], 'readwrite');
    const vaultStore = tx.objectStore(STORES.vault);
    vaultStore.clear();
    vaultStore.put({ key:'__verifier__', ...verifier });
    encrypted.forEach(item => vaultStore.put(item));
    tx.objectStore(STORES.meta).put({ key:'vault_config', salt:b64(newSalt), iterations:310000, auto_lock_minutes:oldConfig?.auto_lock_minutes || 5, rotated_at:now(), created_at:oldConfig?.created_at || now() });
    await txDone(tx);
    vaultKey = newKey;
    resetAutoLock(oldConfig?.auto_lock_minutes || 5);
    await audit('vault.key_rotated', { record_count:encrypted.length });
    return true;
  }

  async function secureMetadataSet(key, value) {
    return vaultSet(`metadata:${key}`, value);
  }

  async function secureMetadataGet(key) {
    return vaultGet(`metadata:${key}`);
  }

  async function cacheIdentity(profile, options = {}) {
    const session = {
      key:'session', user_id:profile.user_id, tenant_id:profile.tenant_id, device_id:profile.device_id,
      profile:profile.profile || {}, authenticated_at:now(), expires_at:new Date(Date.now() + (options.max_offline_hours || 72) * 3600000).toISOString(),
      revoked:false, provisional:true
    };
    if (vaultKey && profile.profile && Object.keys(profile.profile).length) {
      await secureMetadataSet('cached-user-profile', profile.profile);
      session.profile = { encrypted:true };
    }
    await put(STORES.identity, session);
    if (profile.permissions) await put(STORES.permissions, { key:'snapshot', tenant_id:profile.tenant_id, user_id:profile.user_id, device_id:profile.device_id, permissions:profile.permissions, roles:profile.roles || [], captured_at:now(), expires_at:session.expires_at });
    await audit('offline.login', { tenant_id:profile.tenant_id, user_id:profile.user_id, device_id:profile.device_id, expires_at:session.expires_at });
    return session;
  }

  async function offlineSession() {
    const session = await get(STORES.identity, 'session');
    if (!session || session.revoked || Date.parse(session.expires_at) <= Date.now()) return null;
    return session;
  }

  async function canOffline(permission, action = '') {
    const session = await offlineSession();
    const snapshot = await get(STORES.permissions, 'snapshot');
    if (!session || !snapshot || Date.parse(snapshot.expires_at) <= Date.now()) return { allowed:false, provisional:false, reason:'offline-session-expired' };
    const context = assertPermissionContext(session, snapshot);
    if (!context.valid) return { allowed:false, provisional:false, reason:context.reason };
    const allowed = snapshot.permissions?.includes('*') || snapshot.permissions?.includes(permission);
    return { allowed:!!allowed, provisional:allowed && HIGH_RISK.has(action), reason:allowed ? null : 'permission-denied' };
  }

  async function localLogout(reason = 'user') {
    await lockVault('logout');
    await put(STORES.identity, { key:'session', revoked:true, logged_out_at:now(), reason });
    await audit('identity.logout', { reason });
    listeners('chatbot:pwa-logout', { reason });
  }

  async function applyRevocation(payload = {}) {
    const current = await get(STORES.identity, 'session') || { key:'session' };
    current.revoked = true; current.revoked_at = now(); current.revocation_reason = payload.reason || 'server-revoked';
    await put(STORES.identity, current); await lockVault('device-revoked');
    await audit('device.revoked', payload); listeners('chatbot:pwa-device-revoked', payload);
    if (!applyingRemoteSignal && channel) channel.postMessage({ type:'revocation', payload:redact(payload), source:tabId, at:Date.now() });
  }

  async function integrityCheck() {
    const issues = [];
    const db = await openDb();
    for (const name of Object.values(STORES)) if (!db.objectStoreNames.contains(name)) issues.push({ type:'missing-store', store:name, repairable:false });
    const conflicts = await all(STORES.conflicts);
    for (const c of conflicts) if (!c.conflict_uuid || !c.entity_type || !c.status) issues.push({ type:'invalid-conflict', store:STORES.conflicts, id:c.conflict_uuid || null, repairable:true, record:c });
    const tasks = await all(STORES.tasks);
    const taskIds = new Set(tasks.map(t => t.id));
    for (const t of tasks) {
      if (!t.id || !t.type) issues.push({ type:'invalid-task', store:STORES.tasks, id:t.id || null, repairable:true, record:t });
      for (const dependency of (t.dependencies || [])) {
        const id = typeof dependency === 'string' ? dependency : dependency.id;
        if (id && !taskIds.has(id) && dependency.status !== 'synced') issues.push({ type:'orphan-task-dependency', store:STORES.tasks, id:t.id, dependency:id, repairable:false });
      }
    }
    const session = await get(STORES.identity, 'session').catch(() => null);
    const permissions = await get(STORES.permissions, 'snapshot').catch(() => null);
    if (session && permissions) {
      const context = assertPermissionContext(session, permissions);
      if (!context.valid) issues.push({ type:'permission-context-mismatch', reason:context.reason, repairable:false });
    }
    const auditChain = await verifyAuditChain();
    for (const issue of auditChain.issues) issues.push({ ...issue, repairable:false });
    const verifier = await get(STORES.vault, '__verifier__').catch(() => null);
    const vaultConfig = await get(STORES.meta, 'vault_config').catch(() => null);
    if (!!verifier !== !!vaultConfig) issues.push({ type:'incomplete-vault-configuration', repairable:false });
    const vaultIntegrity = await verifyVaultIntegrity();
    for (const issue of vaultIntegrity.issues) issues.push({ ...issue, repairable:false });
    const result = { healthy:issues.length === 0, issues:issues.map(({record, ...issue}) => issue), schema_version:DB_VERSION, checked_at:now() };
    await put(STORES.meta, { key:'last_integrity_check', ...result });
    await audit('integrity.checked', { healthy:result.healthy, issue_count:issues.length });
    return { ...result, _repair_records:issues.filter(i => i.record) };
  }

  async function repairIntegrity(options = {}) {
    const check = await integrityCheck();
    const repaired = [];
    for (const issue of check._repair_records || []) {
      if (!issue.repairable || !issue.record) continue;
      const quarantine = { quarantine_uuid:uuid(), store:issue.store, original_key:issue.id, reason:issue.type, record:redact(issue.record), created_at:now() };
      await put(STORES.quarantine, quarantine);
      if (issue.id) await remove(issue.store, issue.id);
      repaired.push({ type:issue.type, id:issue.id, quarantine_uuid:quarantine.quarantine_uuid });
    }
    await audit('integrity.repaired', { repaired_count:repaired.length, requested_by:options.requested_by || 'local-user' });
    return { repaired, integrity:await integrityCheck() };
  }

  async function exportPendingBackup() {
    const tasks = (await all(STORES.tasks)).filter(t => !['synced','cancelled'].includes(t.status));
    const conflicts = (await all(STORES.conflicts)).filter(c => c.status !== 'resolved');
    const backup = { backup_uuid:uuid(), format:'titan-chatbot-pending-v1', created_at:now(), tasks, conflicts };
    await put(STORES.backups, backup);
    await audit('recovery.backup_created', { task_count:tasks.length, conflict_count:conflicts.length });
    return backup;
  }

  async function prepareSafeReset(options = {}) {
    const pending = (await all(STORES.tasks)).filter(t => !['synced','cancelled'].includes(t.status));
    const backup = await exportPendingBackup();
    const token = uuid();
    await put(STORES.meta, { key:'reset_confirmation', token_hash:await sha256(token), mode:options.mode || 'full-encrypted-wipe', pending_count:pending.length, expires_at:Date.now() + 5 * 60000, created_at:now() });
    await audit('recovery.reset_prepared', { mode:options.mode || 'full-encrypted-wipe', pending_count:pending.length });
    return { confirmation_token:token, expires_in_seconds:300, pending_count:pending.length, backup };
  }

  async function safeReset(options = {}) {
    const pending = (await all(STORES.tasks)).filter(t => !['synced','cancelled'].includes(t.status));
    const confirmation = await get(STORES.meta, 'reset_confirmation').catch(() => null);
    const requiresToken = pending.length > 0 || options.mode !== 'cache-only';
    const validToken = options.confirmation_token && confirmation && confirmation.expires_at > Date.now() && confirmation.mode === (options.mode || 'full-encrypted-wipe') && confirmation.token_hash === await sha256(options.confirmation_token);
    if (requiresToken && !validToken) {
      return { reset:false, requires_confirmation:true, pending_count:pending.length, preparation:await prepareSafeReset(options) };
    }
    if (options.export_first !== false) await exportPendingBackup();
    const db = await openDb();
    const preserve = options.mode === 'cache-only' ? new Set([STORES.tasks, STORES.conflicts, STORES.audit, STORES.identity, STORES.permissions, STORES.vault, STORES.backups]) : new Set([STORES.backups]);
    const targets = Object.values(STORES).filter(s => !preserve.has(s));
    const tx = db.transaction(targets, 'readwrite');
    targets.forEach(s => tx.objectStore(s).clear());
    await txDone(tx);
    if (options.mode !== 'cache-only') vaultKey = null;
    await audit('recovery.reset', { mode:options.mode || 'full-encrypted-wipe' });
    if (!applyingRemoteSignal && channel) channel.postMessage({ type:'reset', mode:options.mode || 'full-encrypted-wipe', source:tabId, at:Date.now() });
    return { reset:true, integrity:await integrityCheck() };
  }

  async function renderConflictCentre() {
    const host = document.querySelector('[data-chatbot-conflict-centre]');
    if (!host) return;
    const conflicts = (await all(STORES.conflicts)).filter(c => c.status !== 'resolved');
    host.innerHTML = conflicts.length ? conflicts.map(c => `<article class="chatbot-conflict-card" data-id="${c.conflict_uuid}"><header><strong>${escapeHtml(c.record_name)}</strong><span>${escapeHtml(c.entity_type)}</span></header><p>${escapeHtml(c.classification)} · ${c.changed_fields.map(escapeHtml).join(', ') || 'record-level conflict'}</p><dl><dt>Local actor/device</dt><dd>${escapeHtml(c.local_actor?.user_id || 'Unknown')} / ${escapeHtml(c.local_actor?.device_id || 'Unknown')}</dd><dt>Server actor/device</dt><dd>${escapeHtml(c.server_actor?.user_id || 'Unknown')} / ${escapeHtml(c.server_actor?.device_id || 'Unknown')}</dd><dt>Created</dt><dd>${escapeHtml(c.created_at)}</dd></dl><details><summary>Compare local and server versions</summary><pre>${escapeHtml(JSON.stringify({local:c.local_version,server:c.server_version},null,2))}</pre></details><details><summary>Resolution history</summary><pre>${escapeHtml(JSON.stringify(c.resolution_history || [],null,2))}</pre></details><fieldset><legend>Fields to keep locally</legend>${c.changed_fields.map(field => `<label><input type="checkbox" data-conflict-field="${escapeHtml(field)}"> ${escapeHtml(field)}</label>`).join('')}</fieldset><div><button data-resolution="keep-local">Keep local</button><button data-resolution="keep-server">Keep server</button><button data-resolution="merge">Merge selected fields</button></div></article>`).join('') : '<p class="chatbot-conflict-empty">No unresolved conflicts.</p>';
  }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }


  if (channel) channel.addEventListener('message', async event => {
    const signal = event.data || {};
    if (!signal.type || signal.source === tabId) return;
    applyingRemoteSignal = true;
    try {
      if (signal.type === 'lock') await lockVault(signal.reason || 'remote-tab', { remote:true });
      if (signal.type === 'revocation') await applyRevocation({ ...(signal.payload || {}), source:'remote-tab' });
      if (signal.type === 'reset') {
        vaultKey = null;
        clearTimeout(autoLockTimer);
        listeners('chatbot:pwa-reset-observed', { mode:signal.mode, remote:true });
      }
    } finally {
      applyingRemoteSignal = false;
    }
  });

  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-resolution]');
    if (!button) return;
    const card = button.closest('[data-id]');
    try {
      const selected_fields = {};
      card.querySelectorAll('[data-conflict-field]').forEach(input => { selected_fields[input.dataset.conflictField] = input.checked ? 'local' : 'server'; });
      await resolveConflict(card.dataset.id, button.dataset.resolution, { selected_fields });
    } catch (error) { listeners('chatbot:pwa-error', { error }); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && vaultKey) lockVault('app-backgrounded'); });
  ['pointerdown','keydown','touchstart'].forEach(name => window.addEventListener(name, async () => {
    if (vaultKey) resetAutoLock((await get(STORES.meta, 'vault_config'))?.auto_lock_minutes || 5);
  }, { passive:true }));

  const lifecycleAuditMap = Object.freeze({
    'chatbot:pwa-task-queued':'message.queued',
    'chatbot:pwa-record-created':'record.created',
    'chatbot:pwa-record-modified':'record.modified',
    'chatbot:pwa-record-deleted':'record.deleted',
    'chatbot:pwa-sync-attempt':'sync.attempted',
    'chatbot:pwa-device-registered':'device.registered',
    'chatbot:pwa-device-revoked-by-server':'device.revoked'
  });
  for (const [eventName, auditType] of Object.entries(lifecycleAuditMap)) {
    window.addEventListener(eventName, event => audit(auditType, redact(event.detail || {})).catch(error => listeners('chatbot:pwa-error', { error })));
  }

  root.security = Object.freeze({
    DB_NAME, DB_VERSION, STORES, SHARED_STATUSES, SHARED_RECORD_FIELDS, OPERATION_FIELDS, openDb, validateSharedRecord, validateOperationEnvelope, assertPermissionContext, classifyConflict, createConflict, resolveConflict,
    initialiseVault, unlockVault, lockVault, vaultSet, vaultGet, rotateVaultKey, verifyVaultIntegrity, secureMetadataSet, secureMetadataGet,
    cacheIdentity, offlineSession, canOffline, localLogout, applyRevocation,
    audit, verifyAuditChain, integrityCheck, repairIntegrity, exportPendingBackup, prepareSafeReset, safeReset, renderConflictCentre,
    biometricAvailable: async () => !!(window.PublicKeyCredential && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.())
  });

  openDb().then(async () => {
    await integrityCheck();
    await renderConflictCentre();
    listeners('chatbot:pwa-security-ready', { schema_version:DB_VERSION });
  }).catch(error => listeners('chatbot:pwa-error', { error }));
})();
