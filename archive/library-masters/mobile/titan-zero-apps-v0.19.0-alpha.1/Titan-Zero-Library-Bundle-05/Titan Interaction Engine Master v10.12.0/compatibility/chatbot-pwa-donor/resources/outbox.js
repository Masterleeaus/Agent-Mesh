(() => {
  'use strict';

  const emit = (name, detail = {}) => window.dispatchEvent(new CustomEvent(name, { detail }));
  const MAX_ATTEMPTS = 8;
  let flushing = false;

  function delayFor(attempt) {
    return Math.min(15 * 60 * 1000, (2 ** Math.max(0, attempt - 1)) * 5000 + Math.floor(Math.random() * 1500));
  }

  async function enqueue(operation) {
    if (!operation || typeof operation !== 'object') throw new TypeError('Outbox operation is required.');
    const operationUuid = operation.operation_uuid || operation.id || `outbox_${crypto.randomUUID()}`;
    const idempotencyKey = operation.idempotency_key || operation.idempotencyKey || crypto.randomUUID();
    const entry = {
      ...operation,
      operation_uuid: operationUuid,
      id: operationUuid,
      type: operation.type || (operation.url ? 'request' : 'sync-operation'),
      url: operation.url || null,
      method: operation.method ? operation.method.toUpperCase() : null,
      headers: operation.headers || {},
      body: operation.body ?? null,
      attachmentIds: operation.attachmentIds || [],
      idempotency_key: idempotencyKey,
      idempotencyKey,
      conversation_uuid: operation.conversation_uuid || operation.conversationId || null,
      status: operation.status || 'queued',
      retry_count: operation.retry_count || operation.attempts || 0,
      attempts: operation.retry_count || operation.attempts || 0,
      created_at: operation.created_at || new Date().toISOString(),
      createdAt: operation.createdAt || Date.now(),
      updated_at: new Date().toISOString(),
      updatedAt: Date.now(),
      next_attempt_at: operation.next_attempt_at || Date.now(),
      nextAttemptAt: operation.nextAttemptAt || operation.next_attempt_at || Date.now()
    };
    await window.TitanDeviceDB.put('outbox', entry);
    emit('chatbot:outbox-changed', { entry, action: 'queued' });
    requestBackgroundSync();
    return entry;
  }

  async function buildBody(entry) {
    if (!entry.attachmentIds?.length) {
      if (entry.body == null || typeof entry.body === 'string' || entry.body instanceof Blob) return entry.body;
      return JSON.stringify(entry.body);
    }
    const form = new FormData();
    if (entry.body && typeof entry.body === 'object') Object.entries(entry.body).forEach(([key, value]) => form.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value)));
    for (const attachmentId of entry.attachmentIds) {
      const attachment = await window.TitanDeviceDB.get('attachments', attachmentId);
      if (attachment?.blob) form.append('files[]', attachment.blob, attachment.name);
    }
    return form;
  }

  async function send(entry) {
    const headers = new Headers(entry.headers || {});
    if (!entry.url || !entry.method) return false;
    headers.set('X-Idempotency-Key', entry.idempotency_key || entry.idempotencyKey);
    const body = await buildBody(entry);
    if (body && typeof body === 'string' && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const response = await fetch(entry.url, { method: entry.method, headers, body, credentials: 'same-origin' });
    if (response.status === 409 || response.status === 412) {
      const conflictUuid = `conflict_${crypto.randomUUID()}`;
      const conflict = { id: conflictUuid, local_uuid: conflictUuid, outbox_id: entry.operation_uuid, conversation_uuid: entry.conversation_uuid, status: 'open', responseStatus: response.status, serverPayload: await response.text(), localOperation: entry, createdAt: Date.now() };
      await window.TitanDeviceDB.put('conflicts', conflict);
      entry.status = 'conflict';
      await window.TitanDeviceDB.put('outbox', entry);
      emit('chatbot:sync-conflict', { conflict });
      return false;
    }
    if (!response.ok) throw new Error(`Server returned ${response.status}.`);
    await window.TitanDeviceDB.delete('outbox', entry.operation_uuid);
    emit('chatbot:outbox-changed', { entry, action: 'sent' });
    return true;
  }

  async function flush() {
    if (flushing || !navigator.onLine) return { sent: 0, failed: 0 };
    flushing = true;
    let sent = 0;
    let failed = 0;
    emit('chatbot:sync-started');
    try {
      const entries = (await window.TitanDeviceDB.getAll('outbox'))
        .filter(entry => entry.url && entry.method && ['queued', 'failed'].includes(entry.status) && (entry.next_attempt_at || entry.nextAttemptAt || 0) <= Date.now())
        .sort((a, b) => String(a.created_at || a.createdAt).localeCompare(String(b.created_at || b.createdAt)));
      for (const entry of entries) {
        entry.status = 'sending';
        entry.updatedAt = Date.now();
        await window.TitanDeviceDB.put('outbox', entry);
        try {
          if (await send(entry)) sent += 1;
        } catch (error) {
          failed += 1;
          entry.attempts = (entry.attempts || entry.retry_count || 0) + 1;
          entry.retry_count = entry.attempts;
          entry.status = entry.attempts >= MAX_ATTEMPTS ? 'needs-review' : 'failed';
          entry.last_error = error.message;
          entry.lastError = error.message;
          entry.next_attempt_at = Date.now() + delayFor(entry.attempts);
          entry.nextAttemptAt = entry.next_attempt_at;
          entry.updatedAt = Date.now();
          await window.TitanDeviceDB.put('outbox', entry);
          emit('chatbot:outbox-changed', { entry, action: entry.status });
        }
      }
    } finally {
      flushing = false;
      emit('chatbot:sync-finished', { sent, failed });
    }
    return { sent, failed };
  }

  async function requestBackgroundSync() {
    try {
      const registration = await navigator.serviceWorker?.ready;
      if (registration?.sync) await registration.sync.register('titan-chatbot-outbox');
    } catch (_) { /* Online event fallback remains active. */ }
  }

  async function cancel(id) {
    await window.TitanDeviceDB.delete('outbox', id);
    emit('chatbot:outbox-changed', { id, action: 'cancelled' });
  }

  async function cancelForEntity(localEntityUuid) {
    const entries = await window.TitanDeviceDB.getAllFromIndex('outbox', 'local_entity_uuid', localEntityUuid);
    await Promise.all(entries.map(entry => cancel(entry.operation_uuid)));
    return entries.length;
  }

  async function retry(id) {
    const entry = await window.TitanDeviceDB.get('outbox', id);
    if (!entry) return null;
    Object.assign(entry, { status: 'queued', next_attempt_at: Date.now(), nextAttemptAt: Date.now(), updated_at: new Date().toISOString(), updatedAt: Date.now() });
    await window.TitanDeviceDB.put('outbox', entry);
    await flush();
    return entry;
  }

  window.addEventListener('online', flush);
  navigator.serviceWorker?.addEventListener('message', event => {
    if (event.data?.type === 'TITAN_FLUSH_OUTBOX') flush();
  });

  window.TitanOutbox = {
    enqueue,
    flush,
    cancel,
    cancelForEntity,
    retry,
    list: () => window.TitanDeviceDB.getAll('outbox'),
    conflicts: () => window.TitanDeviceDB.getAll('conflicts')
  };
})();
