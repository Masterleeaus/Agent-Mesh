(() => {
  const emit = (name, detail = {}) => window.dispatchEvent(new CustomEvent(name, { detail }));
  const state = { online: navigator.onLine, queuedTasks: 0 };
  window.chatbotPwa = Object.assign(window.chatbotPwa || {}, { state });

  function setOnline(online) {
    state.online = online;
    document.documentElement.classList.toggle('chatbot-pwa-offline', !online);
    emit(online ? 'chatbot:pwa-online' : 'chatbot:pwa-offline', { online });
  }

  window.addEventListener('online', () => setOnline(true));
  window.addEventListener('offline', () => setOnline(false));
  setOnline(navigator.onLine);

  window.chatbotPwa.requestNotifications = async () => {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    return Notification.requestPermission();
  };

  window.chatbotPwa.share = async data => {
    if (navigator.share) return navigator.share(data);
    if (data?.url && navigator.clipboard) {
      await navigator.clipboard.writeText(data.url);
      emit('chatbot:pwa-shared', { method: 'clipboard' });
      return { method: 'clipboard' };
    }
    return { method: 'unsupported' };
  };

  window.chatbotPwa.clearCaches = async () => {
    const controller = navigator.serviceWorker?.controller;
    if (controller) controller.postMessage({ type: 'CLEAR_PWA_CACHES' });
  };

  // Compatibility facade: existing chatbot integrations can keep calling queueTask,
  // while operational work is stored in the typed WorkCore outbox.
  window.chatbotPwa.queueTask = async task => {
    if (!task || typeof task !== 'object' || !task.type) throw new TypeError('A task type is required.');
    if (window.TitanWorkCore?.client) {
      return window.TitanWorkCore.client.queue(task.type, task.payload || task, {
        operation_id: task.id,
        idempotency_key: task.idempotency_key,
        resource_key: task.resource_key,
        base_revision: task.base_revision,
        base_etag: task.base_etag,
        confirmation_id: task.confirmation_id
      });
    }
    throw new Error('WorkCore device runtime is not ready.');
  };

  window.chatbotPwa.getQueuedTasks = async () => {
    if (!window.TitanWorkCore?.db) return [];
    return window.TitanWorkCore.db.all(window.TitanWorkCore.contracts.stores.outbox);
  };

  window.chatbotPwa.syncNow = () => window.TitanWorkCore?.client?.sync();
  window.chatbotPwa.getDiagnostics = () => window.TitanWorkCore?.client?.diagnostics();
  window.chatbotPwa.getOfflineReadiness = () => window.TitanWorkCore?.readiness?.inspect();
  window.chatbotPwa.downloadKnowledge = options => window.TitanWorkCore?.knowledge?.download(options);
  window.chatbotPwa.searchKnowledge = (query, options) => window.TitanWorkCore?.knowledge?.search(query, options);
  window.chatbotPwa.createOfflinePack = spec => window.TitanWorkCore?.offlinePacks?.create(spec);
  window.chatbotPwa.getStorageUsage = () => window.TitanWorkCore?.storageManager?.usage();
  window.chatbotPwa.requestPersistentStorage = () => window.TitanWorkCore?.storageManager?.requestPersistent();
  window.chatbotPwa.resetLocalData = async () => {
    await window.TitanWorkCore?.client?.resetLocalData();
    await window.chatbotPwa.clearCaches();
  };
})();
(() => {
  const emit = (name, detail = {}) => window.dispatchEvent(new CustomEvent(name, { detail }));
  const state = { online: navigator.onLine, queuedTasks: 0 };
  window.chatbotPwa = Object.assign(window.chatbotPwa || {}, { state });

  function setOnline(online) {
    state.online = online;
    document.documentElement.classList.toggle('chatbot-pwa-offline', !online);
    emit(online ? 'chatbot:pwa-online' : 'chatbot:pwa-offline', { online });
  }

  window.addEventListener('online', () => setOnline(true));
  window.addEventListener('offline', () => setOnline(false));
  setOnline(navigator.onLine);

  window.chatbotPwa.requestNotifications = async () => {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    return Notification.requestPermission();
  };

  window.chatbotPwa.share = async data => {
    if (navigator.share) return navigator.share(data);
    if (data?.url && navigator.clipboard) {
      await navigator.clipboard.writeText(data.url);
      emit('chatbot:pwa-shared', { method: 'clipboard' });
      return { method: 'clipboard' };
    }
    return { method: 'unsupported' };
  };

  window.chatbotPwa.clearCaches = async () => {
    const controller = navigator.serviceWorker?.controller;
    if (controller) controller.postMessage({ type: 'CLEAR_PWA_CACHES' });
  };

  // Safe, opt-in task queue. It never intercepts chatbot forms or API calls.
  const DB = 'chatbot-pwa';
  const STORE = 'tasks';
  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB, 8);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  window.chatbotPwa.queueTask = async task => {
    if (!task || typeof task !== 'object' || !task.type) throw new TypeError('A task type is required.');
    const db = await openDb();
    const entry = { ...task, id: task.id || crypto.randomUUID(), createdAt: Date.now() };
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(entry);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    emit('chatbot:pwa-task-queued', { task: entry });
    return entry;
  };

  window.chatbotPwa.getQueuedTasks = async () => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE).objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  };
})();
