(() => {
  'use strict';

  const VALID_STATUSES = new Set(['local-only', 'queued', 'sending', 'synced', 'failed', 'needs-review', 'conflict', 'cancelled', 'deleted-locally', 'deleted-remotely']);
  const text = value => String(value ?? '').toLowerCase().trim();
  const uuid = () => crypto.randomUUID();
  const now = () => new Date().toISOString();

  function context() {
    const source = window.TitanChatbotContext || {};
    return {
      tenant_id: source.tenant_id ?? null,
      user_id: source.user_id ?? null,
      device_id: source.device_id ?? localStorage.getItem('titan-chatbot-device-id') ?? null
    };
  }

  function metadata(input = {}, defaults = {}) {
    const stamp = now();
    const ctx = context();
    const status = input.sync_status || defaults.sync_status || 'local-only';
    if (!VALID_STATUSES.has(status)) throw new TypeError(`Unsupported sync status: ${status}`);
    return {
      local_uuid: input.local_uuid || defaults.local_uuid || uuid(),
      server_id: input.server_id ?? defaults.server_id ?? null,
      tenant_id: input.tenant_id ?? defaults.tenant_id ?? ctx.tenant_id,
      user_id: input.user_id ?? defaults.user_id ?? ctx.user_id,
      device_id: input.device_id ?? defaults.device_id ?? ctx.device_id,
      version: Number(input.version ?? defaults.version ?? 0),
      sync_sequence: Number(input.sync_sequence ?? defaults.sync_sequence ?? 0),
      sync_status: status,
      created_at: input.created_at || defaults.created_at || stamp,
      updated_at: input.updated_at || stamp,
      deleted_at: input.deleted_at ?? defaults.deleted_at ?? null,
      last_synced_at: input.last_synced_at ?? defaults.last_synced_at ?? null
    };
  }

  async function unseal(record) {
    if (!record) return null;
    if (record.payload?.alg === 'A256GCM' && window.TitanDeviceVault?.isUnlocked()) {
      return { ...record, payload: await window.TitanDeviceVault.decrypt(record.payload) };
    }
    return record;
  }

  async function sealPayload(payload) {
    return window.TitanDeviceVault?.isUnlocked() ? window.TitanDeviceVault.encrypt(payload) : payload;
  }

  class Repository {
    constructor(storeName, searchFields = []) { this.storeName = storeName; this.searchFields = searchFields; }
    async create(input) {
      const base = metadata(input);
      const record = { ...input, ...base, id: base.local_uuid, payload: await sealPayload(input.payload || {}) };
      record.search_text = this.buildSearch(record, input.payload || {});
      await window.TitanDeviceDB.add(this.storeName, record);
      return unseal(record);
    }
    async upsert(input) {
      const current = input.local_uuid ? await window.TitanDeviceDB.get(this.storeName, input.local_uuid) : null;
      const base = metadata(input, current || {});
      const record = { ...current, ...input, ...base, id: base.local_uuid, payload: await sealPayload(input.payload ?? await this.payloadOf(current)) };
      record.search_text = this.buildSearch(record, input.payload ?? await this.payloadOf(current));
      await window.TitanDeviceDB.put(this.storeName, record);
      return unseal(record);
    }
    async payloadOf(record) { return (await unseal(record))?.payload || {}; }
    async findByLocalUuid(localUuid) { return unseal(await window.TitanDeviceDB.get(this.storeName, localUuid)); }
    async findByServerId(serverId) {
      const matches = await window.TitanDeviceDB.getAllFromIndex(this.storeName, 'server_id', serverId);
      return unseal(matches[0] || null);
    }
    async softDelete(localUuid) {
      const current = await this.findByLocalUuid(localUuid);
      if (!current) return null;
      return this.upsert({ ...current, deleted_at: now(), sync_status: 'deleted-locally' });
    }
    async updateSyncStatus(localUuid, syncStatus, patch = {}) {
      const current = await this.findByLocalUuid(localUuid);
      if (!current) throw new Error(`${this.storeName} record not found.`);
      return this.upsert({ ...current, ...patch, sync_status: syncStatus });
    }
    async paginate(options = {}) {
      const records = await window.TitanDeviceDB.page(this.storeName, options);
      return Promise.all(records.map(unseal));
    }
    async filter(predicate) {
      const records = await window.TitanDeviceDB.getAll(this.storeName);
      const hydrated = await Promise.all(records.map(unseal));
      return hydrated.filter(record => !record.deleted_at && predicate(record));
    }
    async search(query, limit = 50) {
      const needle = text(query);
      if (!needle) return [];
      const results = await this.filter(record => text(record.search_text).includes(needle));
      return results.slice(0, limit);
    }
    buildSearch(record, payload = {}) {
      return this.searchFields.map(field => text(payload[field] ?? record[field])).filter(Boolean).join(' ');
    }
  }

  class ConversationRepository extends Repository {
    constructor() { super('conversations', ['title', 'customer_name', 'last_message', 'channel']); }
    listByChatbot(chatbotId, options = {}) { return this.filter(record => String(record.chatbot_id) === String(chatbotId)).then(records => records.sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))).slice(options.offset || 0, (options.offset || 0) + (options.limit || 30))); }
  }
  class MessageRepository extends Repository {
    constructor() { super('messages', ['message', 'content', 'role', 'sender_name']); }
    listByConversation(conversationUuid) { return this.filter(record => record.conversation_uuid === conversationUuid).then(records => records.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)) || a.local_uuid.localeCompare(b.local_uuid))); }
  }
  class DraftRepository extends Repository {
    constructor() { super('drafts', ['body', 'message']); }
    async findForConversation(conversationUuid) { return (await this.filter(record => record.conversation_uuid === conversationUuid))[0] || null; }
  }
  class AttachmentRepository extends Repository { constructor() { super('attachments', ['name', 'type']); } }
  class CustomerSummaryRepository extends Repository { constructor() { super('customerSummaries', ['name', 'email', 'phone', 'company']); } }
  class ReviewRepository extends Repository { constructor() { super('reviews', ['comment']); } }

  const repositories = {
    conversations: new ConversationRepository(),
    messages: new MessageRepository(),
    drafts: new DraftRepository(),
    attachments: new AttachmentRepository(),
    customerSummaries: new CustomerSummaryRepository(),
    reviews: new ReviewRepository(),
    participants: new Repository('participants', ['name', 'email']),
    supportRequests: new Repository('supportRequests', ['reason', 'message']),
    cannedResponses: new Repository('cannedResponses', ['title', 'content']),
    knowledgeArticles: new Repository('knowledgeArticles', ['title', 'content', 'summary'])
  };

  window.TitanChatbotRepositories = Object.freeze(repositories);
  window.TitanChatbotRepository = Object.freeze({ Repository, metadata, statuses: Object.freeze([...VALID_STATUSES]) });
})();
