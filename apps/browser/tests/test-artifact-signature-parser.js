const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('src/content-script.js', 'utf8');
const context = {
  console: { log() {}, error() {}, warn() {} },
  document: {
    addEventListener() {},
    querySelectorAll() { return []; },
    querySelector() { return null; },
    documentElement: {}
  },
  chrome: {
    runtime: {
      id: 'test-extension',
      onMessage: { addListener() {} },
      sendMessage: async () => ({ ok: true })
    }
  },
  window: { location: { hostname: 'chatgpt.com' } },
  MutationObserver: class { observe() {} disconnect() {} },
  setInterval() { return 1; },
  clearInterval() {},
  setTimeout() { return 1; },
  clearTimeout() {},
  Set,
  Array,
  String,
  Number,
  RegExp
};
vm.runInNewContext(source, context);

assert.strictEqual(typeof context.parseCodeeArtifactBlocks, 'function',
  'content script must expose CODEE artifact signature parsing');

const text = `Some response text\n\nCODEE_ARTIFACT\nPROTOCOL_VERSION: 2\n\nPLAN_ID: plan-123\nRUN_ID: run-abc\nSTEP_ID: step-01\nSTEP_TOKEN: token-xyz\nSTEP_COMPLETED: 1\nSTEP_TOTAL: 3\nSTATUS: completed\n\nARTIFACT_ID: artifact-1\nZIP: Codee-Test-v1.0.0.zip\nTYPE: cumulative\nVERSION: 1.0.0\n\nPARENT_SHA256: N/A\nSHA256: 28c793e63881c52319354cff3265cadae740d73305f2eba2ddbea4382eccbd6a\nZIP_SIZE: 950961\nDELTA_SIZE: N/A\nFILES_CHANGED: 5\n\nTESTS: 43/43 PASS\nVERIFICATION: PASS\nCREATED_AT: 2026-08-15T18:27:00+10:00\nNEXT_ACTION: advance\n\nCODEE_ARTIFACT_READY\n`;

const artifacts = Array.from(context.parseCodeeArtifactBlocks(text));
assert.strictEqual(artifacts.length, 1, 'one complete signature block should parse');
const artifact = artifacts[0];
assert.strictEqual(artifact.protocolVersion, 2);
assert.strictEqual(artifact.planId, 'plan-123');
assert.strictEqual(artifact.runId, 'run-abc');
assert.strictEqual(artifact.stepId, 'step-01');
assert.strictEqual(artifact.stepToken, 'token-xyz');
assert.strictEqual(artifact.stepCompleted, 1);
assert.strictEqual(artifact.stepTotal, 3);
assert.strictEqual(artifact.status, 'completed');
assert.strictEqual(artifact.zip, 'Codee-Test-v1.0.0.zip');
assert.strictEqual(artifact.sha256, '28c793e63881c52319354cff3265cadae740d73305f2eba2ddbea4382eccbd6a');
assert.strictEqual(artifact.verification, 'PASS');
assert.strictEqual(artifact.nextAction, 'advance');
assert.strictEqual(artifact.ready, true);

assert.strictEqual(context.parseCodeeArtifactBlocks(text.replace('CODEE_ARTIFACT_READY', '')).length, 0,
  'incomplete artifact block must not be treated as ready');

console.log('artifact signature parser OK');
