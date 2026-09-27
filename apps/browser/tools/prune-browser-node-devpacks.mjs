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
  "            '../titan-zero/titan-zero-development-prompts.js',\n",
  "            '../titan-zero/titan-zero-development-skills.js',\n",
  "            '../titan-zero/titan-zero-development-profiles.js',\n"
];

for (const line of devOnlyImports) source = source.replace(line, '');

const repositoryRuntime = "            '../repository/repository-coding-pack.js',\n";
if (!source.includes(repositoryRuntime)) {
  const anchor = "            'repository-host-integration.js',\n";
  if (!source.includes(anchor)) throw new Error('Repository host integration anchor missing');
  source = source.replace(anchor, repositoryRuntime + anchor);
}

const titanRuntime = "            '../titan-zero/titan-zero-developer-pack.js',\n";
if (!source.includes(titanRuntime)) {
  const anchor = "            '../integration/host-capabilities.js',\n";
  if (!source.includes(anchor)) throw new Error('Host capabilities anchor missing');
  source = source.replace(anchor, titanRuntime + anchor);
}

for (const required of [
  repositoryRuntime.trim(),
  titanRuntime.trim(),
  "'browser-host-integration.js'",
  "'titan-zero-host-integration.js'",
  "'workforce-host-integration.js'",
  "'../integration/titan-mcp-runtime.js'"
]) {
  if (!source.includes(required)) throw new Error(`Required Browser Node runtime import missing: ${required}`);
}

for (const removed of devOnlyImports) {
  if (source.includes(removed.trim())) throw new Error(`Development-only startup catalogue remains: ${removed.trim()}`);
}

if (source === before) {
  console.log('Browser Node development catalogues already pruned; compatibility runtimes intact.');
  process.exit(0);
}

fs.writeFileSync(workerPath, source);
console.log('Pruned 6 development-only Browser Node startup catalogues and preserved required compatibility runtimes.');
