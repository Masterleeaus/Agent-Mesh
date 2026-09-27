#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workerPath = path.join(root, 'src/lib/service-worker.js');
let source = fs.readFileSync(workerPath, 'utf8');
const before = source;

const removeExact = (pattern, label) => {
  const next = source.replace(pattern, '');
  if (next === source) throw new Error(`Expected ${label} block was not found`);
  source = next;
};

source = source
  .split('\n')
  .filter((line) => !/\.\.\/titan-zero\/(?:agent-mesh-role-topology|manager-[^']+)\.js'/.test(line))
  .join('\n');

removeExact(/async function fetchAgentMeshExecutionAudit\([\s\S]*?\nasync function getMcpInspectorPayload/, 'Agent Mesh execution audit');
source = source.replace('async function getMcpInspectorPayload', 'async function getMcpInspectorPayload');

removeExact(/const MANAGER_AI_WATCH_ALARM='MANAGER_AI_WATCH';[\s\S]*?\nasync function getTitanZeroStatus\(\) \{/, 'legacy Manager AI runtime');
source = source.replace(/\n\s*if \(message\.action === 'GET_MANAGER_AI_STATUS'\)[\s\S]*?\n\s*if \(message\.action === 'GET_TITAN_ZERO_STATUS'\) \{/, "\n\n    if (message.action === 'GET_TITAN_ZERO_STATUS') {");
source = source.replace(/\nensureManagerAIWatchAlarm\(\)\.catch\([^\n]+\);\n/, '\n');
source = source.replace(/\n\s*if \(alarm\.name === MANAGER_AI_WATCH_ALARM\) \{\s*managerAIWatchSweep\(\);\s*return;\s*\}/, '');

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

if (source === before) throw new Error('Prune produced no changes');
fs.writeFileSync(workerPath, source);
console.log('Pruned legacy Agent Mesh/Manager runtime from Browser Node worker.');
