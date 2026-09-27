const assert = require('assert');
const fs = require('fs');
const worker = fs.readFileSync('src/lib/service-worker.js', 'utf8');
const dashboard = fs.readFileSync('src/lib/dashboard-status.js', 'utf8');

assert(worker.includes("'connection-registry.js'"), 'Worker must import the canonical connection registry');
assert(worker.includes("message.action === 'GET_CONNECTION_REGISTRY'"), 'Worker must expose connection registry status');
assert(worker.includes('CodeeConnectionRegistry.build'), 'Worker must derive status through the canonical connection registry');
assert(worker.includes('.health?.(') || worker.includes('.health('), 'Provider/MCP connector health must be actively probed');
assert(worker.includes('getConnectionRegistryPayload'), 'Worker must have one canonical connection aggregation path');
assert(dashboard.includes('connections:'), 'Dashboard status must accept canonical connection state');
assert(dashboard.includes("connectionDashboardState('mcp'"), 'Dashboard infrastructure must derive MCP state from canonical connections');
assert(dashboard.includes("connectionDashboardState('repository.host'"), 'Dashboard infrastructure must derive Repository Host state from canonical connections');
assert(dashboard.includes("connectionDashboardState('artifact.host'"), 'Dashboard infrastructure must derive Artifact Host state from canonical connections');
assert(dashboard.includes("connectionDashboardState('browser.runtime'"), 'Dashboard infrastructure must derive Browser state from canonical connections');

console.log('Connection registry is wired as the canonical health source');
