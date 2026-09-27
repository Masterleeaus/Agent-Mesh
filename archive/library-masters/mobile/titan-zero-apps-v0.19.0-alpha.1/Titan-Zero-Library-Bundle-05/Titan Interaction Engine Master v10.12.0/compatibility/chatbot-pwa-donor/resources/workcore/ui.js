(() => {
  const root = window.TitanWorkCore = window.TitanWorkCore || {};
  function mount() {
    if (document.getElementById('workcore-sync-panel')) return;
    const panel = document.createElement('section');
    panel.id = 'workcore-sync-panel'; panel.className = 'workcore-sync-panel'; panel.hidden = true;
    panel.setAttribute('aria-label', 'WorkCore offline synchronisation');
    panel.innerHTML = `<button type="button" data-workcore-toggle aria-expanded="false">Offline <strong data-workcore-count>0</strong></button>
      <div class="workcore-sync-popover" hidden>
        <div><strong>WorkCore device runtime</strong><small data-workcore-status>Ready</small></div>
        <div class="workcore-sync-actions"><button type="button" data-workcore-sync>Sync now</button><button type="button" data-workcore-queue>View queue</button></div>
        <ol data-workcore-items></ol>
      </div>`;
    document.body.appendChild(panel);
    const toggle = panel.querySelector('[data-workcore-toggle]'), popover = panel.querySelector('.workcore-sync-popover');
    toggle.addEventListener('click', () => { popover.hidden = !popover.hidden; toggle.setAttribute('aria-expanded', String(!popover.hidden)); if (!popover.hidden) render(); });
    panel.querySelector('[data-workcore-sync]').addEventListener('click', () => root.client.sync());
    panel.querySelector('[data-workcore-queue]').addEventListener('click', render);
    panel.hidden = false; render();
  }
  async function render() {
    const panel = document.getElementById('workcore-sync-panel'); if (!panel || !root.db) return;
    const rows = await root.db.all(root.contracts.stores.outbox);
    panel.querySelector('[data-workcore-count]').textContent = String(rows.filter(r => !['sent','cancelled'].includes(r.state)).length);
    panel.querySelector('[data-workcore-status]').textContent = root.state.authRequired ? 'Sign-in required before synchronisation' : (navigator.onLine ? (root.state.syncing ? 'Synchronising operations, files and updates…' : `Online${root.state.lastSync ? ` — last sync ${new Date(root.state.lastSync).toLocaleTimeString()}` : ''}`) : 'Offline — changes remain on this device');
    const list = panel.querySelector('[data-workcore-items]'); list.innerHTML = '';
    rows.filter(r => !['sent','cancelled'].includes(r.state)).slice(-8).reverse().forEach(row => {
      const li = document.createElement('li');
      li.innerHTML = `<span><b>${escapeHtml(row.action)}</b><small>${escapeHtml(row.state)}${row.last_error ? ` — ${escapeHtml(row.last_error)}` : ''}</small></span><span></span>`;
      const actions = li.lastElementChild;
      if (['failed','needs-review'].includes(row.state)) { const retry = document.createElement('button'); retry.textContent = 'Retry'; retry.onclick = () => root.client.retry(row.operation_id); actions.appendChild(retry); }
      if (!['sending','sent'].includes(row.state)) { const cancel = document.createElement('button'); cancel.textContent = 'Cancel'; cancel.onclick = () => root.client.cancel(row.operation_id).then(render); actions.appendChild(cancel); }
      list.appendChild(li);
    });
    if (!list.children.length) list.innerHTML = '<li><span><b>Queue clear</b><small>No unsynchronised WorkCore actions</small></span></li>';
  }
  function escapeHtml(value) { const div = document.createElement('div'); div.textContent = String(value ?? ''); return div.innerHTML; }
  ['workcore:pending-changed','workcore:sync-start','workcore:sync-complete','workcore:operation-failed','workcore:conflict','workcore:pull-complete','workcore:attachment-progress','workcore:attachment-failed','workcore:authentication-required'].forEach(name => window.addEventListener(name, render));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();
  root.ui = { mount, render };
})();
