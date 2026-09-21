const fs = require('fs');
const assert = require('assert');
const source = fs.readFileSync('src/sidebar/sidebar.js', 'utf8');
assert(/protocolMode\s*:\s*['"]signature_v2['"]/.test(source), 'new sidebar plans must use signature_v2 mode');
assert(/runId\s*:\s*createRunId\(tabId\)/.test(source), 'new sidebar plans must create a unique run ID');
for (const field of ['knownArtifactHashes', 'consumedArtifactHashes', 'artifactHistory', 'currentStepId', 'currentStepToken']) {
  assert(source.includes(field), `new plan state must include ${field}`);
}
console.log('sidebar signature mode OK');
