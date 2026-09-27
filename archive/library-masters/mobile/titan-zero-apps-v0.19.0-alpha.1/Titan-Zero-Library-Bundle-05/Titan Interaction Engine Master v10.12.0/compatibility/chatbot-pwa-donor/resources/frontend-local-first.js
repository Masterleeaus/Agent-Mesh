(() => {
  'use strict';

  const repos = () => window.TitanChatbotRepositories;
  const services = () => window.TitanChatbotLocalServices;
  const now = () => new Date().toISOString();
  const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));

  function conversationPayload(record) {
    return { ...(record?.payload || {}), ...record, id: record?.server_id ?? record?.local_uuid, local_uuid: record?.local_uuid };
  }

  function messagePayload(record) {
    const payload = record?.payload || {};
    return {
      ...payload,
      id: record?.server_id ?? record?.local_uuid,
      local_uuid: record?.local_uuid,
      message: payload.message ?? payload.content ?? record?.message ?? '',
      role: payload.role ?? record?.role ?? 'user',
      created_at: record?.created_at,
      updated_at: record?.updated_at,
      sync_status: record?.sync_status,
      is_local: !record?.server_id,
      media_name: payload.media_name ?? record?.media_name ?? null,
      media_url: payload.media_url ?? record?.media_url ?? null,
    };
  }

  async function localConversationFor(id) {
    if (!repos()) return null;
    return (await repos().conversations.findByServerId(id)) || repos().conversations.findByLocalUuid(id);
  }

  async function ensureConversation(serverConversation, chatbotId = null) {
    if (!repos() || !serverConversation) return null;
    const serverId = serverConversation.server_id ?? serverConversation.id ?? null;
    const current = serverId ? await repos().conversations.findByServerId(serverId) :
      (serverConversation.local_uuid ? await repos().conversations.findByLocalUuid(serverConversation.local_uuid) : null);
    return repos().conversations.upsert({
      ...current,
      local_uuid: current?.local_uuid ?? serverConversation.local_uuid,
      server_id: serverId,
      chatbot_id: serverConversation.chatbot_id ?? chatbotId,
      version: Number(serverConversation.version ?? current?.version ?? 0),
      sync_status: serverId ? 'synced' : (serverConversation.sync_status || 'queued'),
      created_at: serverConversation.created_at ?? current?.created_at ?? now(),
      updated_at: serverConversation.updated_at ?? now(),
      last_synced_at: serverId ? now() : current?.last_synced_at,
      payload: { ...(current?.payload || {}), ...serverConversation }
    });
  }

  async function listConversations(chatbotId, fallback = []) {
    if (!repos()) return fallback;
    const local = await repos().conversations.listByChatbot(chatbotId, { limit: 100 });
    if (!local.length) return fallback;
    return local.filter(item => !item.archived && !item.deleted_at).map(conversationPayload);
  }

  async function cacheConversations(conversations, chatbotId) {
    if (!repos()) return [];
    return Promise.all((conversations || []).map(item => ensureConversation(item, chatbotId)));
  }

  async function listMessages(conversationId) {
    const conversation = await localConversationFor(conversationId);
    if (!conversation || !repos()) return [];
    return (await repos().messages.listByConversation(conversation.local_uuid))
      .filter(item => item.sync_status !== 'cancelled' && !item.deleted_at)
      .map(messagePayload);
  }

  async function cacheMessages(conversationId, messages) {
    const conversation = await localConversationFor(conversationId);
    if (!conversation || !repos()) return [];
    const stored = [];
    for (const item of messages || []) {
      const serverId = item.server_id ?? item.id ?? null;
      let current = serverId ? await repos().messages.findByServerId(serverId) : null;
      if (!current && item.local_uuid) current = await repos().messages.findByLocalUuid(item.local_uuid);
      const record = await repos().messages.upsert({
        ...current,
        local_uuid: current?.local_uuid ?? item.local_uuid,
        server_id: serverId,
        conversation_uuid: conversation.local_uuid,
        version: Number(item.version ?? current?.version ?? 0),
        sync_status: serverId ? 'synced' : (item.sync_status || 'queued'),
        created_at: item.created_at ?? current?.created_at ?? now(),
        updated_at: item.updated_at ?? now(),
        last_synced_at: serverId ? now() : current?.last_synced_at,
        payload: { ...(current?.payload || {}), ...item }
      });
      stored.push(record);
    }
    return stored;
  }

  async function createConversationOffline(input = {}) {
    const record = await services().createLocalConversation({
      chatbot_id: input.chatbot_id,
      channel: input.channel || 'web',
      title: input.title || 'New conversation',
      last_message: input.prompt || '',
      payload: input
    });
    return conversationPayload(record);
  }

  async function sendMessageOffline(conversationId, input = {}) {
    let conversation = await localConversationFor(conversationId);
    if (!conversation && input.chatbot_id) conversation = await ensureConversation({ id: conversationId, chatbot_id: input.chatbot_id });
    if (!conversation) throw new Error('Local conversation mapping is unavailable.');
    const attachment = input.file ? await services().attachLocalFile({
      conversation_uuid: conversation.local_uuid,
      message_uuid: null,
      name: input.file.name,
      type: input.file.type,
      size: input.file.size,
      blob: input.file
    }) : null;
    const record = await services().sendLocalMessage({
      conversation_uuid: conversation.local_uuid,
      server_conversation_id: conversation.server_id,
      role: 'user',
      message: input.message || '',
      attachment_uuid: attachment?.local_uuid ?? null,
      payload: {
        message: input.message || '', role: 'user', media_name: input.file?.name || null,
        attachment_uuid: attachment?.local_uuid ?? null, server_conversation_id: conversation.server_id
      }
    });
    await repos().conversations.upsert({
      ...conversation,
      last_message: input.message || input.file?.name || '',
      updated_at: now(),
      payload: { ...conversation.payload, last_message: input.message || input.file?.name || '' }
    });
    return messagePayload(record);
  }

  async function markFailed(localUuid, error) {
    if (!localUuid || !repos()) return;
    await repos().messages.updateSyncStatus(localUuid, 'failed', {
      last_error: String(error?.message || error || 'Network request failed')
    });
  }

  async function acknowledgeMessage(localUuid, serverMessage = {}) {
    if (!localUuid || !repos()) return null;
    const current = await repos().messages.findByLocalUuid(localUuid);
    if (!current) return null;
    const canonical = serverMessage?.data ?? serverMessage ?? {};
    const updated = await repos().messages.upsert({
      ...current,
      server_id: canonical.id ?? current.server_id,
      version: Number(canonical.version ?? current.version ?? 0),
      sync_status: 'synced',
      last_synced_at: now(),
      payload: { ...current.payload, ...canonical }
    });
    await window.TitanOutbox?.cancelForEntity?.(localUuid);
    emit('chatbot:local-message-acknowledged', { message: updated });
    return messagePayload(updated);
  }

  window.TitanChatbotFrontendLocal = Object.freeze({
    listConversations, cacheConversations, ensureConversation, listMessages, cacheMessages,
    createConversationOffline, sendMessageOffline, markFailed, acknowledgeMessage, messagePayload
  });
})();
