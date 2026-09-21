(function attachHostCapabilities(global){
'use strict';
const MCP_REQUIRED=['listConnections','discover','callTool','readResource','getPrompt','health'];
const MCP_GOVERNED_OPTIONAL=['prepareToolMutation','commitToolMutation','createToolBackup','verifyToolBackup','requestToolApproval','verifyToolMutation','auditToolMutation','listMutationReceipts','verifyArtifact'];
const REPOSITORY_OPTIONAL=['readFile','listFiles','search','previewWrite','createBackup','verifyBackup','writeFile','deleteFile','runCommand','requestApproval','verifyMutation','auditMutation','gitStatus','gitDiff'];
function validateMcpHost(host){const missing=MCP_REQUIRED.filter(k=>typeof host?.[k]!=='function');if(missing.length)throw new Error(`Codee MCP host is missing required capabilities: ${missing.join(', ')}`);return true;}
function describe(host){return {mcp:Object.fromEntries([...MCP_REQUIRED,...MCP_GOVERNED_OPTIONAL].map(k=>[k,typeof host?.[k]==='function'])),repository:Object.fromEntries(REPOSITORY_OPTIONAL.map(k=>[k,typeof host?.[k]==='function']))};}
global.CodeeHostCapabilities=Object.freeze({MCP_REQUIRED,MCP_GOVERNED_OPTIONAL,REPOSITORY_OPTIONAL,validateMcpHost,describe});
})(typeof globalThis!=='undefined'?globalThis:this);
