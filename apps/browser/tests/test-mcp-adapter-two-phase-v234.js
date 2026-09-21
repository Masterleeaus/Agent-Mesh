const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={};c.globalThis=c;c.CodeeHostCapabilities={validateMcpHost:()=>true};vm.createContext(c);vm.runInContext(fs.readFileSync('src/integration/mcp-adapter.js','utf8'),c,{filename:'adapter'});
const calls=[];const host={
 mutationGuarantees:{backupBeforeWrite:'server-enforced-verified-prewrite',twoPhaseTickets:true},
 listConnections:()=>[],discover:async()=>({}),health:async()=>({}),callTool:async()=>({}),readResource:async()=>({}),getPrompt:async()=>({}),
 prepareToolMutation:async()=>({}),commitToolMutation:async(id,ticket)=>{calls.push([id,ticket]);return {ticket:{status:'committed'}};},requestToolApproval:async()=>({}),verifyToolMutation:async()=>({}),auditToolMutation:async()=>({}),listMutationReceipts:async()=>[{id:'r1'}]
};
const a=c.CodeeMcpIntegrationAdapter.create(host);assert.strictEqual(a.capabilityDescriptor.twoPhaseMutationTickets,true);assert.strictEqual(typeof a.commitToolMutation,'function');assert.strictEqual(typeof a.listMutationReceipts,'function');
(async()=>{await a.commitToolMutation('c1','mt_'+'a'.repeat(32));assert.deepStrictEqual(calls,[['c1','mt_'+'a'.repeat(32)]]);assert.deepStrictEqual(await a.listMutationReceipts(),[{id:'r1'}]);console.log('MCP adapter two-phase v2.3.4 OK');})().catch(e=>{console.error(e);process.exit(1)});
