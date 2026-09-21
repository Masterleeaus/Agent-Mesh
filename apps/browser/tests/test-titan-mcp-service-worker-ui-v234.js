const fs=require('fs'),assert=require('assert');
const html=fs.readFileSync('src/sidebar/sidebar.html','utf8'),js=fs.readFileSync('src/sidebar/sidebar.js','utf8'),sw=fs.readFileSync('src/lib/service-worker.js','utf8');
for(const id of ['mcp-client-origin','mcp-copy-origin-btn','mcp-discover-btn','mcp-remove-btn','mcp-tools-list','mcp-receipts-list'])assert.ok(html.includes(`id="${id}"`),id);
for(const token of ['MCP_DISCOVER','REMOVE_MCP_CONNECTION','GET_MCP_RECEIPTS','mcp-client-origin','ticketId','argumentsSha256','backupDomains','contentSha256'])assert.ok(js.includes(token)||sw.includes(token),token);
assert.ok(sw.includes("message.action === 'GET_MCP_RECEIPTS'"),'service worker must expose mutation receipts');
console.log('Titan MCP service worker/UI v2.3.4 wiring OK');
