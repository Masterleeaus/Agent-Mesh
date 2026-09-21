const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const html = fs.readFileSync('src/sidebar/sidebar.html','utf8');
const js = fs.readFileSync('src/sidebar/sidebar.js','utf8');
const css = fs.readFileSync('src/sidebar/sidebar.css','utf8');
for (const id of [
  'diagnostics-health','diagnostics-summary','diagnostics-plan','diagnostics-connection',
  'diagnostics-artifact','diagnostics-log','diagnostics-run-btn','diagnostics-repair-btn',
  'diagnostics-rescan-btn','diagnostics-retry-btn','diagnostics-alarm-btn','diagnostics-copy-btn'
]) assert(new RegExp(`id=["']${id}["']`).test(html),`Diagnostics must include #${id}`);
for (const fn of ['loadDiagnostics','renderDiagnostics','runDiagnosticRepair','registerDiagnosticsHandlers','buildDiagnosticsClipboardText','copyAllDiagnostics']) {
  assert(new RegExp(`(?:async\\s+)?function\\s+${fn}\\b`).test(js),`sidebar must wire ${fn}()`);
}
assert(/diagnostic-card/.test(css),'Diagnostics must have dedicated card styling');
console.log('diagnostics page runtime wiring OK');
