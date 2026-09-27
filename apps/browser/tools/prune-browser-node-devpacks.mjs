#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workerPath = path.join(root, 'src/lib/service-worker.js');
let source = fs.readFileSync(workerPath, 'utf8');
const before = source;

const devOnlyImports = [
  "            '../catalog/repository-prompts.js',\n",
  "            '../catalog/repository-skills.js',\n",
  "            '../catalog/repository-profiles.js',\n",
  "            '../repository/repository-coding-pack.js',\n",
  "            '../titan-zero/titan-zero-development-prompts.js',\n",
  "            '../titan-zero/titan-zero-development-skills.js',\n",
  "            '../titan-zero/titan-zero-development-profiles.js',\n",
  "            '../titan-zero/titan-zero-developer-pack.js',\n"
];

for (const line of devOnlyImports) source = source.replace(line, '');

for (const required of [
  "            'browser-host-integration.js',",
  "            'titan-zero-host-integration.js',",
  "            'workforce-host-integration.js',",
  "            '../integration/titan-mcp-runtime.js',"
]) {
  if (!source.includes(required)) throw new Error(`Required Browser Node runtime import missing: ${required.trim()}`);
}

for (const removed of devOnlyImports) {
  if (source.includes(removed.trim())) throw new Error(`Development-only startup import remains: ${removed.trim()}`);
}

if (source === before) {
  console.log('Browser Node development packs already pruned; no change required.');
  process.exit(0);
}

fs.writeFileSync(workerPath, source);
console.log('Removed 8 development-only Browser Node startup imports.');
