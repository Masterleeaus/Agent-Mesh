const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const context = vm.createContext({ console, globalThis: {} });
context.globalThis = context;
for (const file of ['src/lib/connection-registry.js','src/lib/connections-workspace.js']) {
  vm.runInContext(fs.readFileSync(file,'utf8'), context, { filename:file });
}
assert(context.CodeeConnectionsWorkspace, 'CodeeConnectionsWorkspace must exist');
const view = context.CodeeConnectionsWorkspace.build({
  generatedAt:'2026-08-21T01:00:00+10:00',
  registry:{rows:[
    {id:'ai.providers',title:'AI Providers',state:'DEGRADED',lastCheckedAt:'2026-08-21T00:59:00+10:00',reason:'auth'},
    {id:'ai.local',title:'Local AI',state:'CONNECTED',lastCheckedAt:'2026-08-21T00:58:00+10:00'},
    {id:'mcp',title:'Titan MCP',state:'CONNECTED',lastCheckedAt:'2026-08-21T00:57:00+10:00'},
    {id:'repository.host',title:'Repository Host',state:'MISSING'},
    {id:'artifact.host',title:'Artifact Verification Host',state:'CONNECTED'},
    {id:'browser.runtime',title:'Browser Runtime',state:'UNAVAILABLE',reason:'browser-execution-not-enabled'}
  ]},
  providers:[
    {id:'free-one',displayName:'Free One',lifecycle:'FREE',transport:'https',state:'CONNECTED',lastCheckedAt:'2026-08-21T00:55:00+10:00'},
    {id:'local-one',displayName:'Local One',lifecycle:'LOCAL',transport:'localhost',state:'CONNECTED',lastCheckedAt:'2026-08-21T00:54:00+10:00'},
    {id:'byo-one',displayName:'BYO One',lifecycle:'ACTIVE',transport:'https',state:'AUTH_FAILED',lastCheckedAt:'2026-08-21T00:53:00+10:00',reason:'AUTH_FAILED'}
  ]
});
assert.strictEqual(view.schema,'codee.connections.workspace.v1');
assert.deepStrictEqual(Array.from(view.sections).map(s=>s.id), ['free-ai','local-ai','premium-byo','mcp','repository-host','artifact-host','browser']);
assert.strictEqual(view.sections.find(s=>s.id==='free-ai').connections[0].name,'Free One');
assert.strictEqual(view.sections.find(s=>s.id==='premium-byo').connections[0].state,'AUTH_FAILED');
assert.strictEqual(view.sections.find(s=>s.id==='repository-host').state,'MISSING');
assert.strictEqual(view.sections.find(s=>s.id==='browser').actions.disable.available,false);
assert.strictEqual(view.sections.find(s=>s.id==='mcp').actions.test.available,true);
assert(!JSON.stringify(view).toLowerCase().includes('token'), 'workspace must never expose token metadata');
assert(!JSON.stringify(view).toLowerCase().includes('credential'), 'workspace must never expose credential metadata');
console.log('Connections workspace is a sanitized operational projection of canonical connection state');
