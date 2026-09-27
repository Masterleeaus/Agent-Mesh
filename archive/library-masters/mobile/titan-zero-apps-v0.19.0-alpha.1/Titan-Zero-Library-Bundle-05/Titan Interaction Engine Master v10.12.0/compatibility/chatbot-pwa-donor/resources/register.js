(() => {
  if (!('serviceWorker' in navigator)) return;

  const emit = (name, detail = {}) => window.dispatchEvent(new CustomEvent(name, { detail }));

  async function register() {
    try {
      const registration = await navigator.serviceWorker.register('/chatbot-sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      window.chatbotPwaRegistration = registration;
      emit('chatbot:pwa-ready', { registration });

      const notifyUpdate = worker => {
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            emit('chatbot:pwa-update-ready', { registration, worker });
          }
        });
      };

      if (registration.waiting && navigator.serviceWorker.controller) {
        emit('chatbot:pwa-update-ready', { registration, worker: registration.waiting });
      }

      registration.addEventListener('updatefound', () => notifyUpdate(registration.installing));
      setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000);

      window.chatbotPwaApplyUpdate = () => {
        const waiting = registration.waiting;
        if (waiting) waiting.postMessage({ type: 'SKIP_WAITING' });
      };

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    } catch (error) {
      emit('chatbot:pwa-error', { error });
      console.warn('Chatbot PWA service worker registration failed.', error);
    }
  }

  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
})();
