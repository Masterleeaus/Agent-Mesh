(() => {
  'use strict';
  const repos = () => window.TitanChatbotRepositories;
  const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
  const operation = ({ entityType, localUuid, serverId = null, action, expectedVersion = 0, payload = {}, dependencies = [] }) => ({
    operation_uuid: crypto.randomUUID(), idempotency_key: crypto.randomUUID(), entity_type: entityType,
    local_entity_uuid: localUuid, server_entity_id: serverId, action, expected_version: expectedVersion,
    payload, dependencies, created_at: new Date().toISOString(), retry_count: 0, status: 'queued'
  });

  async function queue(envelope) {
    if (!window.TitanOutbox?.enqueue) throw new Error('Outbox is unavailable.');
    await window.TitanOutbox.enqueue(envelope);
    return envelope;
  }

  const services = {
    async createLocalConversation(input) {
      const record = await repos().conversations.create({ ...input, sync_status: 'queued', payload: input.payload || input });
      await queue(operation({ entityType: 'conversation', localUuid: record.local_uuid, action: 'create', payload: record.payload }));
      emit('chatbot:local-conversation-created', { conversation: record });
      return record;
    },
    async sendLocalMessage(input) {
      if (!input.conversation_uuid) throw new TypeError('conversation_uuid is required.');
      const record = await repos().messages.create({ ...input, sync_status: 'queued', payload: input.payload || input });
      await queue(operation({ entityType: 'message', localUuid: record.local_uuid, serverId: record.server_id, action: 'create', expectedVersion: record.version, payload: record.payload, dependencies: input.dependencies || [] }));
      emit('chatbot:local-message-created', { message: record });
      return record;
    },
    async saveDraft(conversationUuid, body, extra = {}) {
      const existing = await repos().drafts.findForConversation(conversationUuid);
      const record = await repos().drafts.upsert({ ...existing, ...extra, local_uuid: existing?.local_uuid, conversation_uuid: conversationUuid, sync_status: 'local-only', payload: { body, ...extra } });
      emit('chatbot:draft-saved', { conversationUuid, draft: record });
      return record;
    },
    async editQueuedMessage(localUuid, patch) {
      const current = await repos().messages.findByLocalUuid(localUuid);
      if (!current || !['queued', 'failed', 'needs-review'].includes(current.sync_status)) throw new Error('Only queued or failed messages can be edited.');
      const updated = await repos().messages.upsert({ ...current, ...patch, sync_status: 'queued', payload: { ...current.payload, ...(patch.payload || patch) } });
      await window.TitanOutbox.cancelForEntity?.(localUuid);
      await queue(operation({ entityType: 'message', localUuid, serverId: updated.server_id, action: updated.server_id ? 'update' : 'create', expectedVersion: updated.version, payload: updated.payload }));
      emit('chatbot:local-message-updated', { message: updated });
      return updated;
    },
    async cancelQueuedMessage(localUuid) {
      const updated = await repos().messages.updateSyncStatus(localUuid, 'cancelled');
      await window.TitanOutbox.cancelForEntity?.(localUuid);
      emit('chatbot:local-message-cancelled', { message: updated });
      return updated;
    },
    async retryFailedMessage(localUuid) {
      const current = await repos().messages.findByLocalUuid(localUuid);
      if (!current || !['failed', 'needs-review', 'conflict'].includes(current.sync_status)) throw new Error('Message is not retryable.');
      const updated = await repos().messages.updateSyncStatus(localUuid, 'queued');
      await queue(operation({ entityType: 'message', localUuid, serverId: updated.server_id, action: updated.server_id ? 'update' : 'create', expectedVersion: updated.version, payload: updated.payload }));
      emit('chatbot:local-message-retried', { message: updated });
      return updated;
    },
    async attachLocalFile(input) {
      const record = await repos().attachments.create({ ...input, sync_status: 'local-only', payload: { name: input.name, type: input.type, size: input.size }, blob: input.blob });
      emit('chatbot:local-attachment-created', { attachment: record });
      return record;
    },
    async markConversationRead(localUuid) { return repos().conversations.upsert({ ...(await repos().conversations.findByLocalUuid(localUuid)), unread_count: 0 }); },
    async pinConversation(localUuid, pinned = true) { return repos().conversations.upsert({ ...(await repos().conversations.findByLocalUuid(localUuid)), pinned }); },
    async archiveConversation(localUuid, archived = true) { return repos().conversations.upsert({ ...(await repos().conversations.findByLocalUuid(localUuid)), archived }); },
    async requestHumanSupport(input) {
      const record = await repos().supportRequests.create({ ...input, sync_status: 'queued', payload: input.payload || input });
      await queue(operation({ entityType: 'human-support-request', localUuid: record.local_uuid, action: 'create', payload: record.payload }));
      emit('chatbot:human-support-requested', { request: record });
      return record;
    },
    async submitOfflineReview(input) {
      const record = await repos().reviews.create({ ...input, sync_status: 'queued', payload: input.payload || input });
      await queue(operation({ entityType: 'review', localUuid: record.local_uuid, action: 'create', payload: record.payload }));
      emit('chatbot:offline-review-submitted', { review: record });
      return record;
    },
    async exportLocalConversation(conversationUuid) {
      const conversation = await repos().conversations.findByLocalUuid(conversationUuid);
      const messages = await repos().messages.listByConversation(conversationUuid);
      const attachments = await repos().attachments.filter(item => item.conversation_uuid === conversationUuid);
      const data = { exported_at: new Date().toISOString(), conversation, messages, attachments: attachments.map(({ blob, ...item }) => item) };
      return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    }
  };
  window.TitanChatbotLocalServices = Object.freeze(services);
})();
