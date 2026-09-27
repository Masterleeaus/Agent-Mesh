#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workerPath = path.join(root, 'src/lib/service-worker.js');
let source = fs.readFileSync(workerPath, 'utf8');
const before = source;

// Repair malformed function seams produced by the original one-shot prune.
source = source.replace('\n(options = {}) {\n', '\nasync function getMcpInspectorPayload(options = {}) {\n');
if (!source.includes('async function getTitanZeroStatus() {') && source.includes('\n    const ready = await ensureTitanZeroRegistered();')) {
  source = source.replace(
    '\n    const ready = await ensureTitanZeroRegistered();',
    '\nasync function getTitanZeroStatus() {\n    const ready = await ensureTitanZeroRegistered();'
  );
}

const stillHasManagerRuntime = [
  "'../titan-zero/agent-mesh-role-topology.js'",
  "'../titan-zero/manager-control-plane.js'",
  "const MANAGER_AI_WATCH_ALARM='MANAGER_AI_WATCH';",
  "message.action === 'GET_MANAGER_AI_STATUS'",
  'TitanCodeManagerAISupervisor'
].some((token) => source.includes(token));

if (stillHasManagerRuntime) {
  source = source
    .split('\n')
    .filter((line) => !/\.\.\/titan-zero\/(?:agent-mesh-role-topology|manager-[^']+)\.js'/.test(line))
    .join('\n');

  source = source.replace(
    /async function fetchAgentMeshExecutionAudit\([\s\S]*?\n(?=async function getMcpInspectorPayload)/,
    ''
  );

  source = source.replace(
    /const MANAGER_AI_WATCH_ALARM='MANAGER_AI_WATCH';[\s\S]*?\n(?=async function getTitanZeroStatus\(\) \{)/,
    ''
  );

  source = source.replace(
    /\n\s*if \(message\.action === 'GET_MANAGER_AI_STATUS'\)[\s\S]*?\n\s*(?=if \(message\.action === 'GET_TITAN_ZERO_STATUS'\) \{)/,
    '\n\n    '
  );
  source = source.replace(/\nensureManagerAIWatchAlarm\(\)\.catch\([^\n]+\);\n/, '\n');
  source = source.replace(/\n\s*if \(alarm\.name === MANAGER_AI_WATCH_ALARM\) \{\s*managerAIWatchSweep\(\);\s*return;\s*\}/, '');
}

for (const forbidden of [
  'MANAGER_AI_WATCH_ALARM',
  'TitanCodeManagerAISupervisor',
  'TitanZeroManagerLiveState',
  'fetchAgentMeshExecutionAudit',
  'bootstrapAgentMeshResume',
  'GET_MANAGER_AI_STATUS',
  'EXECUTE_MANAGER_AI_PLAN',
  'RUN_MANAGER_AI_SUPERVISION'
]) {
  if (source.includes(forbidden)) throw new Error(`Legacy manager runtime token remains: ${forbidden}`);
}
for (const required of [
  'async function getMcpInspectorPayload(options = {}) {',
  'async function getTitanZeroStatus() {'
]) {
  if (!source.includes(required)) throw new Error(`Required Browser Node function seam is missing: ${required}`);
}

if (source === before) {
  console.log('Legacy Agent Mesh/Manager runtime already pruned; no worker changes required.');
  process.exit(0);
}
fs.writeFileSync(workerPath, source);
console.log('Repaired/pruned legacy Agent Mesh/Manager runtime from Browser Node worker.');
