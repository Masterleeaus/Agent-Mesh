const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const ctx = { console };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const file of [
  'src/integration/remote-context-broker.js',
  'src/integration/mcp-governance-gateway.js'
]) vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });

let called = 0;
const adapter = {
  async discover(){ return { tools: [{ name:'safe.read', annotations:{ readOnlyHint:true } }] }; },
  async callTool(){ called++; return { ok:true }; }
};

(async()=>{
  const huge = { payload:'x'.repeat(70000) };
  const result = await ctx.CodeeMcpGovernanceGateway.call(adapter,'c1','safe.read',huge);
  assert.strictEqual(result.ok,false,'oversized direct MCP arguments must fail closed');
  assert(/argument|payload|limit|exceed/i.test(String(result.reason||result.error||'')),'failure must explain argument bound');
  assert.strictEqual(called,0,'transport must not receive oversized direct arguments');

  const small = await ctx.CodeeMcpGovernanceGateway.call(adapter,'c1','safe.read',{ q:'hello' });
  assert.strictEqual(small.ok,true);
  assert.strictEqual(called,1);
  console.log('direct MCP governance argument bounds OK');
})().catch(e=>{console.error(e);process.exit(1);});
