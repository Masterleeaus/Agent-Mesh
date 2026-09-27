(function () {
  'use strict';

  const root = document.querySelector('[data-titan-app="go"]');
  const status = document.getElementById('titan-go-runtime-status');
  const bootstrapNode = document.getElementById('titan-go-bootstrap');
  if (!root || !status || !bootstrapNode) return;

  let bootstrap = {};
  try {
    bootstrap = JSON.parse(bootstrapNode.textContent || '{}');
  } catch (_) {
    bootstrap = {};
  }

  const pwa = bootstrap && typeof bootstrap.pwa === 'object' ? bootstrap.pwa : {};
  const runtime = bootstrap && typeof bootstrap.runtime === 'object' ? bootstrap.runtime : {};
  const cacheKey = 'titan-go:shell:v1';

  function safeSnapshot() {
    return {
      schema: 'titan.apps.go.shell-state.v1',
      surface: 'go',
      company_boundary: 'company_id',
      runtime_mode: String(runtime.mode || 'degraded-shell'),
      pwa_installable: pwa.installable === true,
      offline_capable: pwa.offline_capable === true,
      saved_at: new Date().toISOString()
    };
  }

  function persistNonSensitiveShellState() {
    try {
      window.localStorage.setItem(cacheKey, JSON.stringify(safeSnapshot()));
    } catch (_) {
      // Device storage is optional. Business/provider data is never stored here.
    }
  }

  function updateConnectivity() {
    const online = navigator.onLine !== false;
    root.dataset.connectivity = online ? 'online' : 'offline';
    status.dataset.online = online ? 'true' : 'false';
    status.dataset.mode = String(runtime.mode || 'degraded-shell');
    status.textContent = online
      ? (runtime.ready === true ? 'Titan Go ready' : 'Titan Go running in degraded mode')
      : (pwa.offline_capable === true ? 'Titan Go offline mode' : 'Titan Go is offline');
  }

  window.addEventListener('online', updateConnectivity);
  window.addEventListener('offline', updateConnectivity);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) updateConnectivity();
  });

  persistNonSensitiveShellState();
  updateConnectivity();
})();
