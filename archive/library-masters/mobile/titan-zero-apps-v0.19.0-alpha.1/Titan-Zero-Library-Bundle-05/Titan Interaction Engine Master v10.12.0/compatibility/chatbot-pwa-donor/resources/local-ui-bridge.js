(() => {
  'use strict';
  const qs = (root, selector) => root?.querySelector(selector);
  const statusLabel = status => ({
    'local-only': 'On device', queued: 'Queued', sending: 'Sending', synced: 'Sent', failed: 'Failed',
    'needs-review': 'Needs review', conflict: 'Conflict', cancelled: 'Cancelled', 'deleted-locally': 'Pending deletion', 'deleted-remotely': 'Deleted'
  }[status] || status);

  function renderSyncState(element, status) {
    if (!element) return;
    element.dataset.syncStatus = status;
    element.textContent = statusLabel(status);
    element.hidden = false;
  }

  function installDraftPersistence(root = document) {
    root.querySelectorAll('[data-chatbot-offline-draft]').forEach(input => {
      const conversationUuid = input.dataset.conversationUuid;
      if (!conversationUuid) return;
      let timer;
      input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => window.TitanChatbotLocalServices?.saveDraft(conversationUuid, input.value), 350);
      });
      window.TitanChatbotRepositories?.drafts.findForConversation(conversationUuid).then(draft => {
        if (draft?.payload?.body && !input.value) input.value = draft.payload.body;
      }).catch(() => {});
    });
  }

  function installLifecycleActions(root = document) {
    root.addEventListener('click', async event => {
      const action = event.target.closest('[data-chatbot-local-action]');
      if (!action) return;
      const localUuid = action.dataset.localUuid;
      if (!localUuid) return;
      event.preventDefault();
      try {
        if (action.dataset.chatbotLocalAction === 'retry') await window.TitanChatbotLocalServices.retryFailedMessage(localUuid);
        if (action.dataset.chatbotLocalAction === 'cancel') await window.TitanChatbotLocalServices.cancelQueuedMessage(localUuid);
        if (action.dataset.chatbotLocalAction === 'edit') window.dispatchEvent(new CustomEvent('chatbot:edit-local-message-requested', { detail: { localUuid } }));
      } catch (error) { window.dispatchEvent(new CustomEvent('chatbot:local-action-failed', { detail: { error, localUuid } })); }
    });
  }

  async function refreshIndicators(root = document) {
    const operations = await window.TitanOutbox?.list?.() || [];
    const pending = operations.filter(item => !['synced', 'cancelled'].includes(item.status)).length;
    root.querySelectorAll('[data-chatbot-pending-count]').forEach(node => { node.textContent = String(pending); });
    const last = await window.TitanDeviceDB?.get('metadata', 'last_successful_sync');
    root.querySelectorAll('[data-chatbot-last-sync]').forEach(node => { node.textContent = last?.value ? new Date(last.value).toLocaleString() : 'Never'; });
    root.querySelectorAll('[data-chatbot-connectivity]').forEach(node => { node.textContent = navigator.onLine ? 'Online' : 'Offline'; node.dataset.online = String(navigator.onLine); });
  }

  window.TitanChatbotUIBridge = { renderSyncState, installDraftPersistence, installLifecycleActions, refreshIndicators };
  document.addEventListener('DOMContentLoaded', () => { installDraftPersistence(); installLifecycleActions(); refreshIndicators(); });
  ['online', 'offline', 'chatbot:outbox-changed', 'chatbot:sync-finished', 'chatbot:local-message-created', 'chatbot:local-message-updated'].forEach(name => window.addEventListener(name, () => refreshIndicators()));
})();
