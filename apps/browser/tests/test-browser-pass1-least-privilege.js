const assert = require('assert');
const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('manifest.json','utf8'));
const permissions = new Set(manifest.permissions || []);
assert(permissions.has('debugger'), 'Current browser runtime requires debugger permission for governed CDP execution');
for (const forbidden of ['scripting','activeTab','webRequest']) {
  assert(!permissions.has(forbidden), `Browser runtime must not request unnecessary ${forbidden}`);
}
assert(!(manifest.host_permissions || []).includes('<all_urls>'), 'Pass 1 must not broaden host permissions');
const worker = fs.readFileSync('src/lib/service-worker.js','utf8');
assert(worker.includes("'../browser/browser-capability-contract.js'"), 'service worker must import browser capability contract');
assert(worker.includes("'browser-host-integration.js'"), 'service worker must import browser host integration');
assert(worker.includes("message.action === 'GET_BROWSER_STATUS'"), 'service worker must expose read-only browser contract status');
assert(worker.includes("message.action === 'BROWSER_NAVIGATE'"), 'Current runtime must expose governed browser navigation');
assert(worker.includes("message.action === 'BROWSER_INTERACT'"), 'Current runtime must expose governed browser interaction');
assert(worker.includes("message.action === 'GET_BROWSER_OBSERVABILITY'"), 'Current runtime must expose governed browser observability');
console.log('Browser legacy least-privilege regression updated for current governed runtime');
