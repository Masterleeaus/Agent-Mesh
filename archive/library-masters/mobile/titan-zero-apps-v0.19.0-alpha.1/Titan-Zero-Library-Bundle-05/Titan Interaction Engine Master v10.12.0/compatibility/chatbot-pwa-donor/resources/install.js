(() => {
  let installPrompt = null;
  const emit = (name, detail = {}) => window.dispatchEvent(new CustomEvent(name, { detail }));
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  window.chatbotPwa = window.chatbotPwa || {};
  window.chatbotPwa.isInstalled = standalone;
  window.chatbotPwa.isIOS = isIOS;

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    document.documentElement.classList.add('chatbot-pwa-installable');
    emit('chatbot:pwa-installable', { platform: 'native' });
  });

  window.chatbotPwaInstall = async () => {
    if (standalone()) return { outcome: 'already-installed' };
    if (!installPrompt) {
      if (isIOS) emit('chatbot:pwa-ios-install-help');
      return { outcome: isIOS ? 'ios-manual' : 'unavailable' };
    }
    installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    installPrompt = null;
    document.documentElement.classList.remove('chatbot-pwa-installable');
    emit('chatbot:pwa-install-result', choice);
    return choice;
  };

  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    document.documentElement.classList.remove('chatbot-pwa-installable');
    emit('chatbot:pwa-installed');
  });
})();
