const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={};c.globalThis=c;vm.createContext(c);
vm.runInContext(fs.readFileSync('src/integration/remote-context-broker.js','utf8'),c);
const huge={rows:Array.from({length:50000},(_,i)=>({i,payload:'x'.repeat(200)}))};
const bounded=c.CodeeRemoteContextBroker.truncate(huge,12000);
assert.strictEqual(bounded.truncated,true);
assert(bounded.text.length<=12050,'bounded evidence should not grow beyond budget');
console.log('MCP structural pre-serialization bounds v2 OK');
