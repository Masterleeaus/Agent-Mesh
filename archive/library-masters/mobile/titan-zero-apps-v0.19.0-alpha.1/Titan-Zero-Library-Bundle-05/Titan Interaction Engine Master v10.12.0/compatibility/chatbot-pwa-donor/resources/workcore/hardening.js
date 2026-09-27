(() => {
  const root = window.TitanWorkCore = window.TitanWorkCore || {};
  const emit = (name, detail={}) => window.dispatchEvent(new CustomEvent(name,{detail}));
  let quotaTimer;
  async function storageStatus() {
    const estimate = await navigator.storage?.estimate?.() || {};
    const persisted = await navigator.storage?.persisted?.().catch(()=>false) || false;
    const usage = estimate.usage || 0, quota = estimate.quota || 0;
    return { usage, quota, ratio: quota ? usage / quota : 0, persisted };
  }
  async function requestPersistence() { return navigator.storage?.persist?.() || false; }
  async function checkStorage() {
    const status = await storageStatus();
    if (status.ratio >= .9) emit('workcore:storage-critical', status);
    else if (status.ratio >= .75) emit('workcore:storage-warning', status);
    return status;
  }
  async function hasUnsynced() {
    if (!root.db || !root.contracts) return false;
    const rows = await root.db.all(root.contracts.stores.outbox);
    const attachments = await root.db.all(root.contracts.stores.attachments);
    return rows.some(r => !['sent','cancelled'].includes(r.state)) || attachments.some(a => !['uploaded','cancelled'].includes(a.state));
  }
  async function secureLogout(options={}) {
    const unsynced = await hasUnsynced();
    if (unsynced && !options.force) throw Object.assign(new Error('Unsynchronised WorkCore data remains on this device.'), { code:'UNSYNCED_DATA' });
    root.vault?.lock();
    if (options.clearLocal) await root.client?.resetLocalData?.({ clearFiles:true, force:true });
    emit('workcore:secure-logout', { cleared:Boolean(options.clearLocal) });
    return true;
  }
  function installUnloadGuard() {
    window.addEventListener('beforeunload', event => {
      if ((root.state?.pending || 0) > 0) { event.preventDefault(); event.returnValue = ''; }
    });
  }
  async function recoverSendingOperations() {
    const rows = await root.db.all(root.contracts.stores.outbox);
    const staleBefore = Date.now() - 10 * 60 * 1000;
    let recovered = 0;
    for (const row of rows) {
      if (row.state === 'sending' && Date.parse(row.updated_at || row.created_at || 0) < staleBefore) {
        await root.db.put(root.contracts.stores.outbox, { ...row, state:'queued', available_at:Date.now(), last_error:'Recovered after interrupted sync', updated_at:new Date().toISOString() }); recovered++;
      }
    }
    if (recovered) emit('workcore:operations-recovered', { count:recovered });
    return recovered;
  }
  async function verifyAttachments() {
    const rows = await root.db.all(root.contracts.stores.attachments); const corrupt=[];
    for (const row of rows) {
      try { if (!await root.attachments.verify(row.id)) corrupt.push(row.id); }
      catch (_) { corrupt.push(row.id); }
    }
    for (const id of corrupt) await root.attachments.update(id,{ state:'needs-review', last_error:'Local attachment unavailable or corrupt' });
    if (corrupt.length) emit('workcore:attachment-corruption', { ids:corrupt });
    return corrupt;
  }
  async function initialise() {
    await requestPersistence().catch(()=>false);
    await recoverSendingOperations().catch(()=>0);
    await checkStorage().catch(()=>null);
    quotaTimer = setInterval(()=>checkStorage().catch(()=>null), 5 * 60 * 1000);
    installUnloadGuard();
  }
  root.hardening = { initialise, storageStatus, requestPersistence, checkStorage, hasUnsynced, secureLogout, recoverSendingOperations, verifyAttachments };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise, {once:true}); else initialise();
})();
