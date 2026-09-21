const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const source = fs.readFileSync('src/content-script.js', 'utf8');
const preListener = source.slice(0, source.indexOf('chrome.runtime.onMessage'));

function sig(step, token, hash) {
  return `CODEE_ARTIFACT\nPROTOCOL_VERSION: 2\nPLAN_ID: plan\nRUN_ID: run\nSTEP_ID: step-0${step}\nSTEP_TOKEN: ${token}\nSTEP_COMPLETED: ${step}\nSTEP_TOTAL: 2\nSTATUS: completed\nARTIFACT_ID: a${step}\nZIP: Build-${step}.zip\nTYPE: cumulative\nVERSION: 1.0.${step}\nPARENT_SHA256: N/A\nSHA256: ${hash}\nZIP_SIZE: 1\nDELTA_SIZE: N/A\nFILES_CHANGED: 1\nTESTS: 1/1 PASS\nVERIFICATION: PASS\nCREATED_AT: 2026-08-15T19:00:00+10:00\nNEXT_ACTION: advance\nCODEE_ARTIFACT_READY`;
}
const oldSig = sig(1, 'old', 'a'.repeat(64));
const newSig = sig(2, 'new', 'b'.repeat(64));
const context = {
  console: { log(){}, warn(){}, error(){} },
  chrome: { runtime: { id: 'test' } },
  document: {
    querySelectorAll() { return [{ textContent: oldSig }]; },
    body: { innerText: `${oldSig}\n${newSig}` },
    documentElement: { innerText: `${oldSig}\n${newSig}` }
  },
  Set, Map, Promise, Date, Math
};
vm.runInNewContext(preListener, context);
const artifacts = context.collectCodeeArtifacts();
assert.strictEqual(artifacts.length, 2,
  'whole-page scan must still run when provider selectors found only an older artifact');
assert(artifacts.some(a => a.stepToken === 'new'));
console.log('whole-page scan supplements partial provider selectors OK');
