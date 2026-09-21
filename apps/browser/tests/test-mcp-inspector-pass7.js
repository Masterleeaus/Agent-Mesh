const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const modulePath = 'src/lib/mcp-inspector.js';
assert(fs.existsSync(modulePath), 'Pass 7 must add the canonical read-only MCP inspector projection');
const context = vm.createContext({ console, globalThis: {} });
context.globalThis = context;
for (const file of ['src/integration/mcp-governance-gateway.js', modulePath]) {
  vm.runInContext(fs.readFileSync(file,'utf8'), context, { filename:file });
}
assert(context.CodeeMcpInspector, 'CodeeMcpInspector must exist');
const titanPolicy=(classification,extra={})=>({'io.titanzero/tool-policy':{schema:'titan-mcp-tool-policy/1',classification,...extra}});
const view = context.CodeeMcpInspector.build({
  generatedAt:'2026-08-21T02:30:00+10:00',
  connections:[{id:'c1',name:'Titan Production',baseUrl:'https://titan.example',endpoint:'/mcp/titan',enabled:true,tokenConfigured:true}],
  discoveries:{c1:{ok:true,value:{connectionId:'c1',serverInfo:{name:'Titan MCP',version:'1.5.0'},protocolVersion:'2025-03-26',capabilities:{tools:{},prompts:{}},tools:[
    {name:'titan_runtime_health',description:'Health',inputSchema:{type:'object'},_meta:titanPolicy('READ')},
    {name:'titan_backup_verify',description:'Verify backup',inputSchema:{type:'object',properties:{backupId:{type:'string',example:'secret-backup'}}},_meta:titanPolicy('READ')},
    {name:'titan_repository_write',description:'Write repository file',inputSchema:{type:'object',properties:{path:{type:'string'},token:{type:'string',default:'never-show'}}},_meta:titanPolicy('WRITE',{ticketable:true,backup_domains:['repository'],exact_arguments_required:true})},
    {name:'third_party_flux',description:'Unknown untrusted tool',annotations:{readOnlyHint:true},inputSchema:{type:'object'}}
  ],prompts:[{name:'titan_start_plan',description:'Start plan',arguments:[{name:'plan',required:true}]}],twoPhaseMutationTickets:true,mutationGuarantee:'titan-two-phase-ticket',contractHash:'a'.repeat(64),discoveredAt:'2026-08-21T02:29:00+10:00'}}},
  approvals:[{approvalId:'a1',connectionId:'c1',name:'titan_repository_write',classification:'WRITE',ticketId:'mt_1',argumentsSha256:'b'.repeat(64),backupDomains:['repository'],backupIds:['backup-1'],createdAt:1,expiresAt:9999999999999,details:{contentPreview:'api_key=SHOULD_NOT_ESCAPE'}}],
  receipts:[{id:'r1',connectionId:'c1',tool:'titan_repository_write',classification:'WRITE',ticketId:'mt_1',backupIds:['backup-1'],verificationLevel:'client-readback',verified:true,createdAt:'2026-08-21T02:28:00+10:00'}]
});
assert.strictEqual(view.schema,'codee.mcp.inspector.v1');
assert.strictEqual(view.servers.length,1);
const server=view.servers[0];
assert.strictEqual(server.server.name,'Titan MCP');
assert.strictEqual(server.resources.state,'UNAVAILABLE');
assert.strictEqual(server.prompts.length,1);
const health=server.tools.find(t=>t.name==='titan_runtime_health');
const verify=server.tools.find(t=>t.name==='titan_backup_verify');
const write=server.tools.find(t=>t.name==='titan_repository_write');
const unknown=server.tools.find(t=>t.name==='third_party_flux');
assert.strictEqual(health.classification,'READ');
assert.strictEqual(verify.operationClass,'VERIFY');
assert.strictEqual(write.classification,'WRITE');
assert.strictEqual(write.riskFloor,'HIGH');
assert.strictEqual(write.requiresApproval,true);
assert.strictEqual(write.executionAvailable,false);
assert.strictEqual(write.blockedReason,'approval-required');
assert.strictEqual(unknown.classification,'UNKNOWN');
assert.strictEqual(unknown.executionAvailable,false);
assert.strictEqual(unknown.blockedReason,'mcp-tool-classification-unknown');
assert.strictEqual(server.approvals[0].tool,'titan_repository_write');
assert.strictEqual(server.receipts[0].verificationLevel,'client-readback');
const serialized=JSON.stringify(view).toLowerCase();
assert(!serialized.includes('never-show'), 'tool schema defaults/examples must not leak into inspector');
assert(!serialized.includes('should_not_escape'), 'approval content previews must not leak into inspector');
assert(!serialized.includes('tokenconfigured'), 'credential-state metadata must not leak into inspector');
console.log('MCP inspector projects governed server/tool/prompt/evidence state without creating authority or leaking secrets');
