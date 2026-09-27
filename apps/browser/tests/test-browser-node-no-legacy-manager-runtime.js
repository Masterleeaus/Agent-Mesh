'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const workerPath = path.join(root, 'src', 'lib', 'service-worker.js');
const worker = fs.readFileSync(workerPath, 'utf8');

const forbidden = [
  'MANAGER_AI_WATCH_ALARM',
  'TitanCodeManagerAISupervisor',
  'TitanZeroManagerLiveState',
  'fetchAgentMeshExecutionAudit',
  'bootstrapAgentMeshResume',
  'GET_MANAGER_AI_STATUS',
  'EXECUTE_MANAGER_AI_PLAN',
  'RUN_MANAGER_AI_SUPERVISION',
  "'../titan-zero/agent-mesh-role-topology.js'",
  "'../titan-zero/manager-control-plane.js'"
];

for (const token of forbidden) {
  assert.equal(worker.includes(token), false, `retired Agent Mesh/Manager runtime token must stay absent: ${token}`);
}

for (const retained of [
  'async function getMcpInspectorPayload(options = {}) {',
  'async function getTitanZeroStatus() {'
]) {
  assert.equal(worker.includes(retained), true, `required Browser Node boundary must remain intact: ${retained}`);
}

console.log('PASS: Browser Node excludes retired Agent Mesh/Manager runtime while preserving operational boundaries');
