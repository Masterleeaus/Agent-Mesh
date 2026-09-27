(() => {
  const root = window.TitanWorkCore = window.TitanWorkCore || {};
  const C = root.contracts, DB = root.db;
  const emit = (name, detail = {}) => window.dispatchEvent(new CustomEvent(name, { detail }));
  const now = () => new Date().toISOString();
  const resourceKey = (type, id) => `${type}:${id}`;
  const terminal = new Set(['sent', 'cancelled']);
  const retryable = new Set(['queued', 'failed']);

  const state = root.state = Object.assign({
    online: navigator.onLine, syncing: false, pulling: false, uploading: false,
    pending: 0, lastSync: null, lastPull: null, cursor: null, authRequired: false
  }, root.state || {});

  let context = {
    company_id: null, user_id: null, device_id: null, csrf_token: null,
    api_base: '', access_token: null, refreshAuth: null, batch_size: 25,
    attachment_chunk_size: 1024 * 1024
  };

  async function configure(next = {}) {
    const [storedDevice, storedCompany, storedUser, storedCursor] = await Promise.all([
      DB.getMeta('device_id'), DB.getMeta('company_id'), DB.getMeta('user_id'), DB.getMeta('sync_cursor')
    ]);
    context = {
      ...context, ...next,
      device_id: next.device_id || storedDevice || crypto.randomUUID(),
      company_id: next.company_id ?? storedCompany,
      user_id: next.user_id ?? storedUser
    };
    state.cursor = storedCursor;
    await Promise.all([
      DB.setMeta('device_id', context.device_id),
      context.company_id != null ? DB.setMeta('company_id', context.company_id) : Promise.resolve(),
      context.user_id != null ? DB.setMeta('user_id', context.user_id) : Promise.resolve()
    ]);
    return publicContext();
  }

  function publicContext() {
    return { ...context, access_token: context.access_token ? '[set]' : null, csrf_token: context.csrf_token ? '[set]' : null, refreshAuth: Boolean(context.refreshAuth) };
  }
  const endpoint = path => `${context.api_base || ''}${path}`;

  async function parseResponse(response) {
    const contentType = response.headers.get('Content-Type') || '';
    if (response.status === 204) return null;
    if (contentType.includes('application/json')) return response.json().catch(() => null);
    return response.text().catch(() => null);
  }

  async function refreshAuthentication() {
    if (typeof context.refreshAuth === 'function') {
      const result = await context.refreshAuth();
      if (result && typeof result === 'object') context = { ...context, ...result };
      state.authRequired = false;
      return true;
    }
    try {
      const response = await fetch(endpoint(C.endpoints.refreshSession), {
        method: 'POST', credentials: 'include', headers: { Accept: 'application/json' }
      });
      if (!response.ok) return false;
      const body = await parseResponse(response);
      if (body?.access_token) context.access_token = body.access_token;
      state.authRequired = false;
      return true;
    } catch (_) { return false; }
  }

  async function api(path, options = {}, allowRefresh = true) {
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');
    headers.set('X-WorkCore-Device', context.device_id || 'unknown');
    if (context.company_id != null) headers.set('X-WorkCore-Company', String(context.company_id));
    if (!(options.body instanceof FormData) && options.body != null) headers.set('Content-Type', 'application/json');
    if (context.csrf_token) headers.set('X-CSRF-TOKEN', context.csrf_token);
    if (context.access_token) headers.set('Authorization', `Bearer ${context.access_token}`);

    const response = await fetch(endpoint(path), { credentials: 'include', ...options, headers });
    const body = await parseResponse(response);
    if (response.status === 401 && allowRefresh && await refreshAuthentication()) return api(path, options, false);
    if (!response.ok) {
      const message = body?.message || body?.error?.message || (typeof body === 'string' && body) || `WorkCore request failed (${response.status})`;
      const error = new Error(message);
      error.status = response.status; error.body = body; error.etag = response.headers.get('ETag');
      if (response.status === 401) { state.authRequired = true; emit('workcore:authentication-required', { error }); }
      throw error;
    }
    return { body, etag: response.headers.get('ETag'), status: response.status, headers: response.headers };
  }

  async function log(level, event, data = {}) {
    try { await DB.put(C.stores.syncLog, { level, event, data, created_at: now() }); } catch (_) {}
  }

  async function saveRecord(type, record, meta = {}) {
    if (!record?.id) throw new TypeError('WorkCore records require an id.');
    const key = resourceKey(type, record.id);
    const row = {
      key, type, id: record.id, company_id: context.company_id,
      revision: meta.revision ?? record.revision ?? null,
      etag: meta.etag ?? record.etag ?? null,
      updated_at: record.updated_at || meta.updated_at || now(),
      deleted: Boolean(record.deleted), data: record
    };
    await DB.put(C.stores.records, row);
    if (row.deleted) await DB.put(C.stores.tombstones, { key, type, id: record.id, deleted_at: row.updated_at });
    return row;
  }
  async function getRecord(type, id) { return DB.get(C.stores.records, resourceKey(type, id)); }
  async function listRecords(type) { return DB.byIndex(C.stores.records, 'by_type', type); }

  async function applyTombstone(item) {
    const type = item.type || item.resource_type;
    const id = item.id || item.resource_id;
    if (!type || id == null) return false;
    const key = resourceKey(type, id);
    await DB.put(C.stores.tombstones, { key, type, id, deleted_at: item.deleted_at || now(), revision: item.revision ?? null });
    await DB.remove(C.stores.records, key);
    if (['job', 'work_order', 'job_pack'].includes(type)) await DB.remove(C.stores.jobPacks, String(id));
    emit('workcore:tombstone-applied', { type, id });
    return true;
  }

  async function saveJobPack(pack) {
    const id = String(pack.id || pack.job?.id || pack.work_order?.id || '');
    if (!id) throw new TypeError('Job pack requires an id.');
    const row = {
      ...pack, id, company_id: context.company_id,
      downloaded_at: now(), updated_at: pack.updated_at || now(),
      expires_at: pack.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    await DB.put(C.stores.jobPacks, row);
    emit('workcore:job-pack-saved', { pack: row }); return row;
  }
  async function listJobPacks() { return DB.byIndex(C.stores.jobPacks, 'by_company', context.company_id); }

  async function pullJobPacks(options = {}) {
    if (!navigator.onLine) return { skipped: true, reason: 'offline' };
    const params = new URLSearchParams();
    if (options.since) params.set('since', options.since);
    if (options.assigned_only !== false) params.set('assigned_only', '1');
    if (options.limit) params.set('limit', String(options.limit));
    const { body } = await api(`${C.endpoints.jobPacks}${params.size ? `?${params}` : ''}`);
    const packs = body?.data || body?.job_packs || body || [];
    let saved = 0;
    for (const pack of Array.isArray(packs) ? packs : []) { await saveJobPack(pack); saved += 1; }
    await DB.setMeta('last_job_pack_pull', now());
    emit('workcore:job-packs-pulled', { saved });
    return { saved };
  }

  async function pullChanges(options = {}) {
    if (state.pulling || !navigator.onLine) return { skipped: true, reason: state.pulling ? 'busy' : 'offline' };
    state.pulling = true; emit('workcore:pull-start');
    try {
      const cursor = options.cursor ?? state.cursor ?? await DB.getMeta('sync_cursor');
      const params = new URLSearchParams();
      if (cursor) params.set('cursor', cursor);
      params.set('device_id', context.device_id);
      if (options.limit) params.set('limit', String(options.limit));
      const { body } = await api(`${C.endpoints.changes}?${params}`);
      const envelope = body?.data || body || {};
      const changes = envelope.changes || envelope.records || [];
      const tombstones = envelope.tombstones || envelope.deleted || [];
      let applied = 0, removed = 0;
      for (const change of changes) {
        const type = change.type || change.resource_type;
        const record = change.record || change.data || change;
        if (type && record?.id != null) { await saveRecord(type, record, change); applied += 1; }
      }
      for (const tombstone of tombstones) if (await applyTombstone(tombstone)) removed += 1;
      const nextCursor = envelope.next_cursor || envelope.cursor || cursor || null;
      state.cursor = nextCursor; state.lastPull = now();
      await Promise.all([DB.setMeta('sync_cursor', nextCursor), DB.setMeta('last_pull', state.lastPull)]);
      emit('workcore:pull-complete', { applied, removed, cursor: nextCursor });
      return { applied, removed, cursor: nextCursor };
    } catch (error) {
      await log('error', 'pull_failed', { message: error.message, status: error.status || 0 });
      emit('workcore:pull-failed', { error }); throw error;
    } finally { state.pulling = false; }
  }

  async function queue(action, payload = {}, options = {}) {
    if (!action || typeof action !== 'string') throw new TypeError('A WorkCore action is required.');
    const operation_id = options.operation_id || crypto.randomUUID();
    const idempotency_key = options.idempotency_key || operation_id;
    const entry = {
      operation_id, idempotency_key, device_id: context.device_id, company_id: context.company_id,
      user_id: context.user_id, action, payload, confirmation_id: options.confirmation_id || null,
      resource_key: options.resource_key || null, base_revision: options.base_revision ?? null,
      base_etag: options.base_etag || null, state: 'queued', attempts: 0, created_at: now(),
      occurred_at: options.occurred_at || now(), available_at: Date.now(), last_error: null
    };
    await DB.put(C.stores.outbox, entry); await refreshPending();
    emit('workcore:operation-queued', { operation: entry }); registerBackgroundSync(); return entry;
  }
  async function updateOperation(entry, patch) { const updated = { ...entry, ...patch, updated_at: now() }; await DB.put(C.stores.outbox, updated); return updated; }
  async function refreshPending() {
    const rows = await DB.all(C.stores.outbox);
    state.pending = rows.filter(r => !terminal.has(r.state)).length;
    emit('workcore:pending-changed', { count: state.pending }); return state.pending;
  }
  async function cancel(operationId) {
    const row = await DB.get(C.stores.outbox, operationId); if (!row || row.state === 'sending') return false;
    await updateOperation(row, { state: 'cancelled' }); await refreshPending(); return true;
  }
  async function retry(operationId) {
    const row = await DB.get(C.stores.outbox, operationId); if (!row) return false;
    await updateOperation(row, { state: 'queued', available_at: Date.now(), last_error: null });
    await sync(); return true;
  }
  async function captureConflict(entry, result, status = 409) {
    const conflict = {
      id: crypto.randomUUID(), operation_id: entry.operation_id, status: 'open',
      resource_key: entry.resource_key, local: entry.payload,
      server: result?.data || result?.server || result || null,
      base_revision: entry.base_revision, server_etag: result?.etag || null,
      created_at: now()
    };
    await DB.put(C.stores.conflicts, conflict);
    await updateOperation(entry, { state: status === 409 ? 'conflict' : 'needs-review', last_error: result?.message || 'Conflict requires review' });
    emit('workcore:conflict', { conflict });
  }
  function retryDelay(attempts) { return Math.min(15 * 60 * 1000, Math.max(2000, (2 ** Math.min(attempts, 8)) * 1000)); }

  function operationPayload(entry) {
    const payload = { ...entry.payload };
    if (entry.base_revision != null && payload.base_revision == null) payload.base_revision = entry.base_revision;
    return {
      operation_id: entry.operation_id, idempotency_key: entry.idempotency_key,
      device_id: entry.device_id, company_id: entry.company_id, user_id: entry.user_id,
      action: entry.action, payload, occurred_at: entry.occurred_at,
      confirmation_id: entry.confirmation_id, base_etag: entry.base_etag
    };
  }

  async function reconcileResult(entry, result, responseStatus = 200) {
    const status = result?.status || result?.state || (responseStatus >= 200 && responseStatus < 300 ? 'accepted' : 'failed');
    if (['accepted', 'replayed', 'sent', 'completed'].includes(status)) {
      await updateOperation(entry, { state: 'sent', completed_at: now(), server_result: result, last_error: null });
      const record = result?.record || result?.data?.record;
      const type = result?.resource_type || result?.data?.resource_type;
      if (record?.id != null && type) await saveRecord(type, record, { revision: result.revision, etag: result.etag });
      emit('workcore:operation-sent', { operation: entry, result }); return true;
    }
    if (status === 'conflict') { await captureConflict(entry, result, 409); return false; }
    if (status === 'needs-review') { await captureConflict(entry, result, 412); return false; }
    const permanent = ['rejected', 'invalid', 'forbidden'].includes(status);
    await updateOperation(entry, {
      state: permanent ? 'needs-review' : 'failed',
      available_at: Date.now() + retryDelay(entry.attempts || 1),
      last_error: result?.message || `Server returned ${status}`,
      server_result: result
    });
    emit('workcore:operation-failed', { operation: entry, result }); return false;
  }

  async function sendOne(entry) {
    entry = await updateOperation(entry, { state: 'sending', attempts: (entry.attempts || 0) + 1 });
    try {
      const headers = { 'Idempotency-Key': entry.idempotency_key };
      if (entry.base_etag) headers['If-Match'] = entry.base_etag;
      const { body, status } = await api(C.endpoints.operations, { method: 'POST', headers, body: JSON.stringify(operationPayload(entry)) });
      return reconcileResult(entry, body?.data || body, status);
    } catch (error) {
      if ([409, 412].includes(error.status)) { await captureConflict(entry, { ...(error.body || {}), etag: error.etag }, error.status); return false; }
      const needsReview = [400, 403, 404, 422].includes(error.status);
      const authBlocked = error.status === 401;
      await updateOperation(entry, {
        state: needsReview || authBlocked ? 'needs-review' : 'failed',
        available_at: Date.now() + retryDelay(entry.attempts),
        last_error: error.message, error_status: error.status || 0
      });
      emit('workcore:operation-failed', { operation: entry, error }); return false;
    }
  }

  async function sendBatch(entries) {
    const sending = [];
    for (const row of entries) sending.push(await updateOperation(row, { state: 'sending', attempts: (row.attempts || 0) + 1 }));
    try {
      const { body, status } = await api(C.endpoints.operationsBatch, {
        method: 'POST', body: JSON.stringify({ device_id: context.device_id, operations: sending.map(operationPayload) })
      });
      const results = body?.data?.results || body?.results || body?.data || [];
      const byId = new Map((Array.isArray(results) ? results : []).map(item => [item.operation_id, item]));
      let sent = 0;
      for (const entry of sending) if (await reconcileResult(entry, byId.get(entry.operation_id) || { status: 'failed', message: 'No result returned for operation' }, status)) sent += 1;
      return { sent, supported: true };
    } catch (error) {
      if ([404, 405, 501].includes(error.status)) {
        for (const entry of sending) await updateOperation(entry, { state: 'queued', last_error: null });
        return { sent: 0, supported: false };
      }
      for (const entry of sending) {
        await updateOperation(entry, { state: error.status === 401 ? 'needs-review' : 'failed', available_at: Date.now() + retryDelay(entry.attempts), last_error: error.message });
      }
      return { sent: 0, supported: true };
    }
  }

  async function uploadAttachment(id) {
    const item = await root.attachments.get(id); if (!item) return false;
    let { record, blob } = item;
    if (record.state === 'uploaded') return true;
    if (!await root.attachments.verify(id)) {
      await root.attachments.update(id, { state: 'needs-review', last_error: 'Local checksum mismatch' }); return false;
    }
    state.uploading = true;
    try {
      let session = await DB.get(C.stores.uploadSessions, id);
      if (!session) {
        const { body } = await api(C.endpoints.attachments, {
          method: 'POST', body: JSON.stringify({
            attachment_id: id, name: record.name, mime_type: record.type, size: record.size,
            checksum: record.checksum, resource_key: record.resource_key, operation_id: record.operation_id,
            chunk_size: record.chunk_size || context.attachment_chunk_size
          })
        });
        const data = body?.data || body || {};
        session = {
          attachment_id: id, upload_id: data.upload_id || data.id || id,
          upload_url: data.upload_url || C.endpoints.attachmentSession(data.upload_id || data.id || id),
          uploaded_bytes: data.uploaded_bytes || 0, chunk_size: data.chunk_size || record.chunk_size || context.attachment_chunk_size,
          state: 'uploading', updated_at: now()
        };
        await DB.put(C.stores.uploadSessions, session);
      }
      let offset = session.uploaded_bytes || 0;
      await root.attachments.update(id, { state: 'uploading', uploaded_bytes: offset });
      while (offset < blob.size) {
        const end = Math.min(offset + session.chunk_size, blob.size);
        const chunk = blob.slice(offset, end);
        const response = await fetch(endpoint(session.upload_url), {
          method: 'PUT', credentials: 'include',
          headers: {
            'Content-Type': record.type, 'Content-Range': `bytes ${offset}-${end - 1}/${blob.size}`,
            'X-Attachment-Checksum': record.checksum, 'X-WorkCore-Device': context.device_id,
            ...(context.access_token ? { Authorization: `Bearer ${context.access_token}` } : {}),
            ...(context.csrf_token ? { 'X-CSRF-TOKEN': context.csrf_token } : {})
          }, body: chunk
        });
        if (response.status === 401 && await refreshAuthentication()) continue;
        if (!response.ok) throw Object.assign(new Error(`Attachment upload failed (${response.status})`), { status: response.status });
        const result = await parseResponse(response);
        offset = result?.uploaded_bytes ?? end;
        session = { ...session, uploaded_bytes: offset, updated_at: now() };
        await DB.put(C.stores.uploadSessions, session);
        await root.attachments.update(id, { state: 'uploading', uploaded_bytes: offset });
        emit('workcore:attachment-progress', { id, uploaded: offset, total: blob.size });
      }
      const { body } = await api(session.upload_url, { method: 'POST', body: JSON.stringify({ complete: true, checksum: record.checksum }) });
      await root.attachments.update(id, { state: 'uploaded', uploaded_bytes: blob.size, server_result: body, completed_at: now(), last_error: null });
      await DB.remove(C.stores.uploadSessions, id);
      emit('workcore:attachment-uploaded', { id, result: body }); return true;
    } catch (error) {
      await root.attachments.update(id, { state: [400, 403, 404, 409, 412, 422].includes(error.status) ? 'needs-review' : 'failed', last_error: error.message });
      emit('workcore:attachment-failed', { id, error }); return false;
    } finally { state.uploading = false; }
  }

  async function syncAttachments() {
    const rows = await DB.all(C.stores.attachments);
    let uploaded = 0;
    for (const row of rows.filter(r => ['local', 'failed', 'uploading'].includes(r.state))) if (await uploadAttachment(row.id)) uploaded += 1;
    return { uploaded };
  }

  async function pushOperations() {
    const rows = (await DB.all(C.stores.outbox))
      .filter(r => retryable.has(r.state) && (r.available_at || 0) <= Date.now())
      .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
    if (!rows.length) return { sent: 0 };
    let sent = 0;
    for (let i = 0; i < rows.length; i += context.batch_size) {
      const chunk = rows.slice(i, i + context.batch_size);
      const result = await sendBatch(chunk);
      if (result.supported) sent += result.sent;
      else for (const entry of chunk) if (await sendOne(entry)) sent += 1;
    }
    return { sent };
  }

  async function sync(options = {}) {
    if (state.syncing || !navigator.onLine) return { skipped: true, reason: state.syncing ? 'busy' : 'offline' };
    state.syncing = true; emit('workcore:sync-start');
    try {
      // Upload local evidence first so queued evidence commands can reference server-confirmed files.
      const attachments = await syncAttachments();
      const pushed = await pushOperations();
      let pulled = { applied: 0, removed: 0 };
      if (options.pull !== false) pulled = await pullChanges().catch(error => ({ applied: 0, removed: 0, error: error.message }));
      state.lastSync = now(); await DB.setMeta('last_sync', state.lastSync); await refreshPending();
      const result = { sent: pushed.sent, uploaded: attachments.uploaded, ...pulled, remaining: state.pending, at: state.lastSync };
      await log('info', 'sync_complete', result); emit('workcore:sync-complete', result); return result;
    } finally { state.syncing = false; }
  }

  async function registerBackgroundSync() {
    try { const registration = await navigator.serviceWorker?.ready; await registration?.sync?.register('workcore-outbox'); } catch (_) {}
  }
  async function resetLocalData(options = {}) {
    if (!options.force && root.hardening?.hasUnsynced && await root.hardening.hasUnsynced()) {
      throw Object.assign(new Error('Unsynchronised WorkCore data remains on this device.'), { code: 'UNSYNCED_DATA' });
    }
    if (options.clearFiles !== false) await root.attachments?.clearAll?.();
    root.vault?.lock?.();
    await DB.reset(); state.pending = 0; state.lastSync = null; state.lastPull = null; state.cursor = null; emit('workcore:local-reset');
  }
  async function diagnostics() {
    const [outbox, conflicts, packs, attachments, tombstones, uploads] = await Promise.all([
      DB.all(C.stores.outbox), DB.all(C.stores.conflicts), DB.all(C.stores.jobPacks),
      DB.all(C.stores.attachments), DB.all(C.stores.tombstones), DB.all(C.stores.uploadSessions)
    ]);
    return {
      contracts: C.version, context: publicContext(), state: { ...state },
      counts: { outbox: outbox.length, pending: outbox.filter(r => !terminal.has(r.state)).length, conflicts: conflicts.length, jobPacks: packs.length, attachments: attachments.length, tombstones: tombstones.length, uploadSessions: uploads.length },
      capabilities: { indexedDB: 'indexedDB' in window, opfs: Boolean(navigator.storage?.getDirectory), backgroundSync: 'SyncManager' in window, online: navigator.onLine }
    };
  }

  window.addEventListener('online', () => { state.online = true; sync(); });
  window.addEventListener('offline', () => { state.online = false; });
  navigator.serviceWorker?.addEventListener('message', event => { if (event.data?.type === 'WORKCORE_SYNC_REQUEST') sync(); });

  root.client = {
    configure, api, saveRecord, getRecord, listRecords, saveJobPack, listJobPacks,
    pullJobPacks, pullChanges, applyTombstone, queue, sync, pushOperations, syncAttachments,
    uploadAttachment, retry, cancel, refreshPending, resetLocalData, diagnostics,
    resourceKey, getContext: publicContext
  };
})();
