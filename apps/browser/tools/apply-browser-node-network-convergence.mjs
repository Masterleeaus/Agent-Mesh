#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targets = [
  'src/browser/agent-runtime/actions/evaluate.js',
  'src/browser/agent-runtime/llm/gemini-provider.js',
  'src/browser/agent-runtime/llm/local-openai-provider.js',
  'src/browser/agent-runtime/llm/openrouter-provider.js',
  'src/browser/agent-runtime/safety/script-risk.js'
];
let changed = 0;
for (const rel of targets) {
  const file = path.join(root, rel);
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace(/\bfetch\s*\(/g, 'globalThis.CodeeApprovedNetworkTransport.request(');
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed += 1;
    console.log(`patched network boundary: ${rel}`);
  }
}

const workerPath = path.join(root, 'src/lib/service-worker.js');
const workerBefore = fs.readFileSync(workerPath, 'utf8');
const oldHeader = `// PRIVATE TITAN CODE DEVELOPMENT-ONLY\n// NOT FOR TITAN ZERO PRODUCTION USE\n// NOT A TITAN ZERO RUNTIME DEPENDENCY\n//\n// Canonical Titan Code remains this worker. The mature imported browser-agent\n// runtime is loaded as an ESM sidecar so its ReAct/MV3/session implementation is\n// preserved rather than rewritten. It owns Auto Browser message types; Titan\n// Code retains Plan Runner, AI/provider, repository, workforce and Titan Zero\n// development authorities below.\n`;
const newHeader = `// TITAN ZERO BROWSER NODE\n// Governed browser execution surface for Titan Zero field-service operations.\n// The imported browser-agent runtime provides browser mechanics only; canonical\n// business authority, company_id, WorkItems, decisions, execution and evidence\n// remain owned by Titan Zero runtime systems.\n`;
const workerAfter = workerBefore.includes(oldHeader) ? workerBefore.replace(oldHeader, newHeader) : workerBefore;
if (workerAfter !== workerBefore) {
  fs.writeFileSync(workerPath, workerAfter);
  changed += 1;
  console.log('patched Browser Node worker identity');
}

console.log(`Browser Node convergence patch changed ${changed} files.`);
