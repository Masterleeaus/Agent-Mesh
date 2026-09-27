(() => {
  const root = window.TitanWorkCore = window.TitanWorkCore || {};
  async function run() {
    const tests=[]; const test=async(name,fn)=>{try{await fn();tests.push({name,ok:true});}catch(error){tests.push({name,ok:false,error:error.message});}};
    await test('IndexedDB opens',()=>root.db.open());
    await test('Crypto random UUID available',()=>{ if(!crypto.randomUUID) throw new Error('crypto.randomUUID unavailable'); });
    await test('Web Crypto AES-GCM available',async()=>{ const k=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt']); if(!k) throw new Error('AES-GCM unavailable'); });
    await test('Service worker supported',()=>{ if(!('serviceWorker' in navigator)) throw new Error('Service workers unsupported'); });
    await test('Storage estimate available',async()=>{ await navigator.storage?.estimate?.(); });
    await test('Outbox schema accessible',async()=>{ await root.db.all(root.contracts.stores.outbox); });
    const result={ok:tests.every(t=>t.ok),tests,at:new Date().toISOString()};
    window.dispatchEvent(new CustomEvent('workcore:self-test-complete',{detail:result})); return result;
  }
  root.selfTests={run};
})();
