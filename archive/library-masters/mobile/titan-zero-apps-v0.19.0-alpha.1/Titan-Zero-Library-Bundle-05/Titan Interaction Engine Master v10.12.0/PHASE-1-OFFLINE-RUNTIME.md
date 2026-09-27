# Titan Chatbot PWA — Phase 1 Offline Device Runtime

This release adds an additive offline runtime without replacing chatbot builder code or automatically intercepting existing forms.

## Included

- IndexedDB schema for conversations, messages, drafts, attachments, outbox operations, metadata and conflicts.
- Optional AES-256-GCM device vault with PBKDF2-derived session key.
- Local conversation/message/draft/attachment APIs.
- Transactional request outbox with idempotency keys.
- Queued, sending, failed, needs-review and conflict states.
- Exponential retry delay and manual retry/cancel APIs.
- HTTP 409/412 conflict capture instead of blind replay.
- Background Sync wake-up hooks with online-event fallback.
- Visible pending-item and manual-sync indicator.
- Local database statistics and full local reset capability.

## Browser API

```js
await TitanDeviceVault.initialise('a strong device passphrase');
await TitanOfflineStore.saveDraft(conversationId, { text: 'Draft reply' });

await TitanOutbox.enqueue({
  type: 'message',
  url: '/api/v2/chatbot/.../messages',
  method: 'POST',
  body: { message: 'Job completed' },
  conversationId
});

await TitanOutbox.flush();
```

## Integration boundary

The queue is opt-in in this pass. Existing chatbot requests remain untouched until their exact payload, CSRF, authentication and attachment conventions are mapped. This prevents duplicate messages and protects the current builder/runtime behaviour.

## Next Phase 1 pass

Map the existing conversation message and file submission functions to the outbox adapter, add draft autosave to the existing input, and add server acknowledgement fields for delivered/read states.
