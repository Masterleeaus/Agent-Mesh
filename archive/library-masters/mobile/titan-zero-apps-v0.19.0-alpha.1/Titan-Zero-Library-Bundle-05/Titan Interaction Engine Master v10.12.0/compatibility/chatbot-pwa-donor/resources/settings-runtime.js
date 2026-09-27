(() => {
  const KEY = 'titan-zero-settings-v1';
  const defaults = {
    processing_mode: 'device-first', privacy_mode: 'device-first-hybrid',
    redact_personal: true, ask_before_attachments: true, wifi_uploads: false,
    auto_download_jobs: true, notifications: true, quiet_hours: false,
    theme: 'system', text_size: 'normal', reduced_motion: false, language: 'en-AU',
    providers: {}, permissions: {}, channels: {}
  };
  const read = () => { try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (_) { return { ...defaults }; } };
  const write = value => { localStorage.setItem(KEY, JSON.stringify(value)); window.dispatchEvent(new CustomEvent('titan:settings-changed', { detail: value })); return value; };
  let state = read();
  async function saveProvider(id, values) {
    if (!id || !values?.api_key) throw new Error('Provider and API key are required.');
    const vault = window.TitanWorkCore?.vault;
    if (!vault?.isUnlocked?.()) throw new Error('Unlock the device vault before saving an API key.');
    const encrypted = await vault.encrypt({ api_key: values.api_key, base_url: values.base_url || '', model: values.model || '' }, `titan-provider:${id}`);
    state.providers[id] = { connected: true, storage: 'device-vault', model: values.model || '', encrypted, updated_at: new Date().toISOString() };
    write(state); return { ...state.providers[id], encrypted: '[protected]' };
  }
  function disconnectProvider(id) { delete state.providers[id]; write(state); }
  function update(patch) { state = { ...state, ...patch }; return write(state); }
  function status() {
    const wc = window.TitanWorkCore;
    return {
      providers: Object.values(state.providers || {}).filter(p => p.connected).length,
      vault: wc?.vault?.isUnlocked?.() ? 'Unlocked' : 'Locked',
      workcore: wc?.client ? 'Connected' : 'Not connected',
      connection: navigator.onLine ? 'Online' : 'Offline',
      pending: wc?.state?.pending || 0,
      last_sync: wc?.state?.lastSync || null,
      theme: state.theme,
      language: state.language
    };
  }
  async function diagnostics() {
    const wc = window.TitanWorkCore;
    return {
      settings: status(),
      capabilities: wc?.device?.capabilities || {},
      storage: await wc?.hardening?.storageStatus?.().catch(() => null),
      self_tests: await wc?.selfTests?.run?.().catch(error => ({ error: error.message }))
    };
  }
  window.TitanSettings = { get: () => structuredClone(state), update, saveProvider, disconnectProvider, status, diagnostics };
})();
