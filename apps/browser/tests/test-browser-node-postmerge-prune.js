const fs = require('fs');
const path = require('path');
const assert = require('assert');

const workerPath = path.resolve(__dirname, '../src/lib/service-worker.js');
const worker = fs.readFileSync(workerPath, 'utf8');

assert(worker.includes('async function getMcpInspectorPayload(options = {}) {'), 'MCP inspector function signature must remain intact');

for (const forbidden of [
  "MANAGER_AI_WATCH_ALARM",
  "TitanCodeManagerAISupervisor",
  "TitanZeroManagerLiveState",
  "GET_MANAGER_AI_STATUS",
  "RUN_MANAGER_AI_SUPERVISION",
  "EXECUTE_MANAGER_AI_PLAN",
  "../titan-zero/agent-mesh-role-topology.js",
  "../titan-zero/manager-control-plane.js"
]) {
  assert(!worker.includes(forbidden), `legacy Agent Mesh/Manager runtime token must stay removed: ${forbidden}`);
}

assert(worker.includes("if (message.action === 'GET_TITAN_ZERO_STATUS')"), 'Titan Zero status route must remain available');
assert(worker.includes('NEXT_RUNNER_ALARM_PREFIX'), 'Next Runner runtime must remain available');
assert(worker.includes('browser-host-integration.js'), 'Browser capability host integration must remain available');

console.log('PASS: Browser Node post-merge prune guard');
