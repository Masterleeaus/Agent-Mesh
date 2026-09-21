const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={};c.globalThis=c;vm.createContext(c);for(const f of ['src/repository/repository-policy.js','src/integration/remote-context-broker.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
const adapter={async callTool(){return {token:'live-secret-token',data:'safe'}},async readResource(){throw new Error('password="live-pass"')},async getPrompt(){return 'authorization="Bearer abc123"'}};
(async()=>{
 const out=await c.CodeeRemoteContextBroker.gather(adapter,[{connectionId:'c',tool:'t'},{connectionId:'c',resource:'r'},{connectionId:'c',prompt:'p'}],{maxChars:5000});
 const text=JSON.stringify(out);
 assert(!/live-secret-token|live-pass|abc123/.test(text),'MCP evidence/errors must redact secret-like values');
 assert(text.includes('[redacted]'),'redaction markers should remain observable');
 console.log('Repository MCP evidence redaction OK');
})().catch(e=>{console.error(e);process.exit(1)});
