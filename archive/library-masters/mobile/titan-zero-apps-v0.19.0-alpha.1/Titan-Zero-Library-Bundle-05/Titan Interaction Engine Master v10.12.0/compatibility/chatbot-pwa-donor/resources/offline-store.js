(() => {
  'use strict';

  const id = prefix => `${prefix}_${crypto.randomUUID()}`;
  const now = () => Date.now();

  async function seal(value) {
    return window.TitanDeviceVault?.isUnlocked() ? window.TitanDeviceVault.encrypt(value) : value;
  }

  async function unseal(value) {
    return value?.alg === 'A256GCM' ? window.TitanDeviceVault.decrypt(value) : value;
  }

  const api = {
    async saveConversation(conversation) {
      if (!conversation?.id) throw new TypeError('Conversation id is required.');
      const record = { ...conversation, id: conversation.id, local_uuid: conversation.local_uuid || conversation.id, chatbot_id: conversation.chatbot_id ?? conversation.chatbotId ?? null, updated_at: conversation.updated_at ?? conversation.updatedAt ?? now(), payload: await seal(conversation.payload || {}) };
      await window.TitanDeviceDB.put('conversations', record);
      return record;
    },
    async getConversation(conversationId) {
      const record = await window.TitanDeviceDB.get('conversations', conversationId);
      if (!record) return null;
      return { ...record, payload: await unseal(record.payload) };
    },
    async listConversations(chatbotId) {
      const records = chatbotId
        ? await window.TitanDeviceDB.getAllFromIndex('conversations', 'chatbot_id', chatbotId)
        : await window.TitanDeviceDB.getAll('conversations');
      return Promise.all(records.sort((a, b) => (b.updated_at || b.updatedAt || 0) - (a.updated_at || a.updatedAt || 0)).map(async record => ({ ...record, payload: await unseal(record.payload) })));
    },
    async saveMessage(message) {
      const record = {
        id: message.id || id('msg'),
        conversation_uuid: message.conversation_uuid || message.conversationId,
        status: message.status || 'local',
        payload: await seal(message.payload || message),
        created_at: message.created_at || message.createdAt || now(),
        updated_at: now(),
        sync_status: message.sync_status || message.status || 'local-only'
      };
      await window.TitanDeviceDB.put('messages', record);
      return record;
    },
    async listMessages(conversationId) {
      const records = await window.TitanDeviceDB.getAllFromIndex('messages', 'conversation_uuid', conversationId);
      return Promise.all(records.sort((a, b) => (a.created_at || a.createdAt || 0) - (b.created_at || b.createdAt || 0)).map(async record => ({ ...record, payload: await unseal(record.payload) })));
    },
    async saveDraft(conversationId, draft) {
      const record = { id: `draft:${conversationId}`, conversation_uuid: conversationId, payload: await seal(draft), updated_at: now() };
      await window.TitanDeviceDB.put('drafts', record);
      window.dispatchEvent(new CustomEvent('chatbot:draft-saved', { detail: { conversationId } }));
      return record;
    },
    async getDraft(conversationId) {
      const record = await window.TitanDeviceDB.get('drafts', `draft:${conversationId}`);
      return record ? { ...record, payload: await unseal(record.payload) } : null;
    },
    async removeDraft(conversationId) {
      return window.TitanDeviceDB.delete('drafts', `draft:${conversationId}`);
    },
    async saveAttachment(attachment) {
      const record = {
        id: attachment.id || id('att'),
        conversation_uuid: attachment.conversation_uuid || attachment.conversationId,
        name: attachment.name || 'attachment',
        type: attachment.type || attachment.blob?.type || 'application/octet-stream',
        size: attachment.size || attachment.blob?.size || 0,
        blob: attachment.blob,
        sync_status: attachment.sync_status || attachment.status || 'local-only',
        created_at: now()
      };
      await window.TitanDeviceDB.put('attachments', record);
      return record;
    },
    listAttachments: conversationId => window.TitanDeviceDB.getAllFromIndex('attachments', 'conversation_uuid', conversationId),
    deleteAttachment: attachmentId => window.TitanDeviceDB.delete('attachments', attachmentId),
    async saveUiState(id, value, context = {}) {
      const record = { id, message_id: context.messageId || null, conversation_id: context.conversationId || null, payload: await seal(value), updated_at: now() };
      await window.TitanDeviceDB.put('uiState', record);
      return record;
    },
    async getUiState(id) {
      const record = await window.TitanDeviceDB.get('uiState', id);
      return record ? { ...record, payload: await unseal(record.payload) } : null;
    },
    deleteUiState: id => window.TitanDeviceDB.delete('uiState', id),
    async stats() {
      const pairs = await Promise.all(['conversations', 'messages', 'drafts', 'attachments', 'outbox', 'conflicts', 'uiState'].map(async store => [store, await window.TitanDeviceDB.count(store)]));
      return Object.fromEntries(pairs);
    }
  };

  window.TitanOfflineStore = api;
})();
