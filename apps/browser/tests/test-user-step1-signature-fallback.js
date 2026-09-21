const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('src/content-script.js', 'utf8');
const preListener = source.slice(0, source.indexOf('chrome.runtime.onMessage'));
const signature = `CODEE_ARTIFACT\nPROTOCOL_VERSION: 2\n\nPLAN_ID: aee8886c-2bbd-4966-a92e-5ccda1cbe46b\nRUN_ID: run-479e0f8d-64e8-4a4f-9b34-2d07973ef1ba\nSTEP_ID: step-01\nSTEP_TOKEN: token-24f65b79-d503-48e9-b2aa-26099499fd9f\nSTEP_COMPLETED: 1\nSTEP_TOTAL: 27\nSTATUS: completed\n\nARTIFACT_ID: 89c8f95e-9434-4cf4-bf9c-fa313fe7f87e\nZIP: Codee-Agents-1-2-3-INTEGRATED-CUMULATIVE-v1.1.4-r4-Step01-ChatGPT-NewChat-Identity-Promotion.zip\nTYPE: cumulative\nVERSION: 1.1.4\n\nPARENT_SHA256: N/A\nSHA256: 8c8b2ad3071048cdfeab5742c0d33be208841e4c1848d174b409deec23369fc8\nZIP_SIZE: 974285 bytes\nDELTA_SIZE: N/A\nFILES_CHANGED: 9\n\nTESTS: 407/407 PASS; packaged new-chat lifecycle stress 25/25 PASS; packaged exactly-once stress 25/25 PASS\nVERIFICATION: PASS - clean ZIP extraction, full active and donor suites, JS syntax, 37 JSON files, manifest references, deterministic content-script rebuild, one-way identity promotion, restart reconstruction, and durable artifact advancement verified\nCREATED_AT: 2026-08-15T18:45:18+10:00\nNEXT_ACTION: advance\n\nCODEE_ARTIFACT_READY`;

const context = {
  console: { log() {}, warn() {}, error() {} },
  chrome: { runtime: { id: 'test' } },
  document: {
    querySelectorAll() { return []; },
    body: { innerText: `Conversation wrapper\n${signature}\nEnd wrapper` },
    documentElement: { innerText: `Conversation wrapper\n${signature}\nEnd wrapper` }
  },
  Set, Map, Promise, Date, Math
};
vm.runInNewContext(preListener, context);
const artifacts = context.collectCodeeArtifacts();
assert.strictEqual(artifacts.length, 1, 'whole-page fallback must find a canonical footer even if provider message selectors change');
assert.strictEqual(artifacts[0].stepToken, 'token-24f65b79-d503-48e9-b2aa-26099499fd9f');
assert.strictEqual(artifacts[0].sha256, '8c8b2ad3071048cdfeab5742c0d33be208841e4c1848d174b409deec23369fc8');
console.log('user Step 1 signature whole-page fallback OK');
