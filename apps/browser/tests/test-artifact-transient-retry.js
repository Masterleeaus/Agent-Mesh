const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('src/content-script.js', 'utf8');
const signature = `CODEE_ARTIFACT\nPROTOCOL_VERSION: 2\nPLAN_ID: plan-r\nRUN_ID: run-r\nSTEP_ID: step-01\nSTEP_TOKEN: token-r\nSTEP_COMPLETED: 1\nSTEP_TOTAL: 2\nSTATUS: completed\nARTIFACT_ID: artifact-r\nZIP: Build-v1.0.0.zip\nTYPE: cumulative\nVERSION: 1.0.0\nPARENT_SHA256: N/A\nSHA256: cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc\nZIP_SIZE: 100\nDELTA_SIZE: N/A\nFILES_CHANGED: 1\nTESTS: 1/1 PASS\nVERIFICATION: PASS\nCREATED_AT: 2026-08-15T19:00:00+10:00\nNEXT_ACTION: advance\nCODEE_ARTIFACT_READY`;
let attempts = 0;
const chrome = { runtime: { id: 'test', onMessage: { addListener() {} }, async sendMessage(message) {
  if (message.action === 'CONTENT_READY') return { ok: false, error: 'worker not ready' };
  if (message.action === 'ARTIFACT_DETECTED') {
    attempts++;
    return attempts === 1
      ? { ok: false, retryable: true, reason: 'not-awaiting-artifact' }
      : { ok: true, advanced: true };
  }
  return { ok: true };
}}};
const context = {
  chrome,
  console: { log() {}, warn() {}, error() {} },
  document: {
    querySelectorAll() { return []; },
    querySelector() { return null; },
    body: { innerText: signature },
    documentElement: { innerText: signature }
  },
  window: { location: { hostname: 'chatgpt.com' } },
  Event: function(){}, KeyboardEvent: function(){},
  setInterval(){ return 1; }, clearInterval(){}, setTimeout(fn){ fn(); return 1; }, clearTimeout(){},
  MutationObserver: undefined,
  Set, Map, Promise, Date, Math
};
vm.runInNewContext(source, context);

(async () => {
  context.checkForZIP();
  await new Promise(resolve => setImmediate(resolve));
  assert.strictEqual(attempts, 1);
  context.checkForZIP();
  await new Promise(resolve => setImmediate(resolve));
  assert.strictEqual(attempts, 2,
    'an artifact rejected only because the worker is not awaiting it yet must remain retryable');
  console.log('transient artifact rejection stays retryable OK');
})().catch(error => { console.error(error); process.exit(1); });
