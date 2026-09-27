const fs=require('fs'); const assert=require('assert');
const mcp=fs.readFileSync('src/integration/mcp-adapter.js','utf8'); const host=fs.readFileSync('src/lib/repository-host-integration.js','utf8');
assert(/implementsTransport:false/.test(mcp)); assert(/ownsMcpRuntime:false/.test(mcp));
assert(!/WebSocket|EventSource|fetch\s*\(|XMLHttpRequest|new\s+Server|listen\s*\(/.test(host),'repository integration must not implement MCP transport');
console.log('Repository MCP transport non-ownership OK');
