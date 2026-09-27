#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workerPath = path.join(root, 'src', 'lib', 'service-worker.js');
const sidebarPath = path.join(root, 'src', 'sidebar', 'sidebar.html');

const compatibilityImports = [
  '../repository/repository-policy.js',
  '../repository/repository-inventory.js',
  '../repository/repository-search.js',
  '../repository/symbol-index.js',
  '../repository/dependency-graph.js',
  '../repository/laravel-tracer.js',
  '../repository/migration-guard.js',
  '../repository/diff-engine.js',
  '../repository/impact-engine.js',
  '../repository/change-set.js',
  '../repository/rollback-planner.js',
  '../repository/mutation-envelope.js',
  '../repository/command-policy.js',
  '../repository/test-selector.js',
  '../repository/verification-planner.js',
  '../repository/dependency-analyzer.js',
  '../repository/git-intelligence.js',
  '../repository/log-analyzer.js',
  '../repository/error-classifier.js',
  '../integration/repository-host-adapter.js',
  '../catalog/repository-prompts.js',
  '../catalog/repository-skills.js',
  '../catalog/repository-profiles.js',
  '../repository/repository-coding-pack.js',
  'repository-host-integration.js',
  '../titan-zero/titan-zero-development-prompts.js',
  '../titan-zero/titan-zero-development-skills.js',
  '../titan-zero/titan-zero-development-profiles.js',
  '../titan-zero/titan-zero-developer-pack.js'
];

let worker = fs.readFileSync(workerPath, 'utf8');
const workerBefore = worker;
const anchor = "            '../integration/host-capabilities.js',";
if (!worker.includes(anchor)) throw new Error('service-worker compatibility insertion anchor missing');
const missing = compatibilityImports.filter(item => !worker.includes(`'${item}',`));
if (missing.length) {
  const block = missing.map(item => `            '${item}',`).join('\n') + '\n';
  worker = worker.replace(anchor, block + anchor);
}
if (worker !== workerBefore) fs.writeFileSync(workerPath, worker);

let html = fs.readFileSync(sidebarPath, 'utf8');
const htmlBefore = html;
html = html.replaceAll('Titan Code', 'Titan Zero Browser Node');
html = html.replaceAll('TITAN CODE', 'TITAN ZERO');
html = html.replaceAll('../../public/branding/codee-logo.png', '../../public/branding/titan-zero-browser-node.svg');
html = html.replace('<title>Titan Zero Browser Node - Plan Runner</title>', '<title>Titan Zero Browser Node</title>');
html = html.replace('aria-label="Titan Zero Browser Node pages"', 'aria-label="Titan Zero Browser Node navigation"');
html = html.replace('<span>Workspace</span>', '<span>Browser Node</span>');
html = html.replace('Conversation-aware plan orchestration', 'Governed browser execution');
html = html.replace('Titan Zero Browser Node Project', 'Titan Zero Browser Node');
html = html.replace('14-manager runtime', 'Titan AI Workforce');
html = html.replace('Checking manager readiness…', 'Checking workforce readiness…');
html = html.replace('New Plan', 'New Work');
html = html.replace('Continue Plan', 'Continue Work');
html = html.replace(/\s*<button class="btn btn-secondary" type="button" data-dashboard-action="dashboard-analyze-repository">Analyze Repository<\/button>/g, '');
html = html.replace(/\s*<button class="btn btn-secondary" type="button" data-dashboard-action="dashboard-ask-codee">Ask Titan Zero Browser Node<\/button>/g, '');
html = html.replace('▶ Run a Plan', '▶ Run Governed Work');
html = html.replace('Paste a plan or load a local Markdown/text file.', 'Provide a governed work instruction or load a local work specification.');
html = html.replaceAll('Managers & AI Workforce', 'Titan AI Workforce');
html = html.replace('Route the task to specialist managers and prepare evidence requests. Managers are advisory and cannot advance plans.', 'Route governed browser work to the Titan AI Workforce and prepare evidence requests. Workforce recommendations never create execution authority.');
html = html.replace('Specialist managers classify tasks, select evidence and prepare plan drafts. They never advance Titan Zero Browser Node plans or mutate systems directly.', 'Titan workforce specialists classify work, select evidence and prepare governed work drafts. They never create execution authority or mutate systems directly.');
html = html.replace('Enable manager routing', 'Enable workforce routing');
html = html.replace('Select a primary manager plus bounded supporting specialists for each task.', 'Select the appropriate workforce specialist plus bounded supporting specialists for each work item.');
html = html.replace('Analyze Managers', 'Analyze Workforce');
html = html.replace('Create Plan Draft', 'Prepare Work Draft');
html = html.replace('No manager preflight yet.', 'No workforce preflight yet.');
html = html.replace('Manager Preflight:', 'Workforce Preflight:');

if (!html.includes('<title>Titan Zero Browser Node</title>')) throw new Error('Browser Node title conversion failed');
if (!html.includes('aria-label="Titan Zero Browser Node navigation"')) throw new Error('Browser Node navigation label conversion failed');
if (!html.includes('<strong>TITAN ZERO</strong>')) throw new Error('Browser Node drawer branding conversion failed');
if (!html.includes('<h1>TITAN ZERO</h1>')) throw new Error('Browser Node header branding conversion failed');
for (const forbidden of ['<title>Titan Code', 'TITAN CODE', '14-manager runtime', 'Managers & AI Workforce']) {
  if (html.includes(forbidden)) throw new Error(`legacy visible branding remains: ${forbidden}`);
}
if (html !== htmlBefore) fs.writeFileSync(sidebarPath, html);

console.log(JSON.stringify({ restoredCompatibilityImports: missing.length, workerChanged: worker !== workerBefore, sidebarChanged: html !== htmlBefore }, null, 2));
