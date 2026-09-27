(function attachRepositoryProfiles(global){
'use strict';
const rows=[
['repository-architect','Repository Architect',['repository-inventory','symbol-discovery','dependency-tracing','change-impact']],
['laravel-engineer','Laravel Engineer',['laravel-route-tracing','laravel-model-tracing','migration-safety','targeted-testing']],
['extension-engineer','Titan Extension Engineer',['extension-architecture','dependency-tracing','migration-safety','change-impact']],
['database-engineer','Database Engineer',['migration-safety','laravel-model-tracing','backup-gated-mutation','rollback-planning']],
['frontend-engineer','Frontend Engineer',['repository-search','dependency-tracing','diff-analysis','targeted-testing']],
['runtime-debugger','Runtime Debugger',['runtime-log-analysis','error-classification','laravel-route-tracing','remote-context-brokering']],
['test-engineer','Verification Engineer',['targeted-testing','verification-planning','release-evidence']],
['release-engineer','Release Engineer',['git-state-analysis','change-set-tracking','rollback-planning','release-evidence']],
['security-reviewer','Security Reviewer',['secret-protection','path-safety','command-classification','diff-analysis']],
['mcp-context-engineer','MCP Context Engineer',['mcp-tool-consumption','mcp-resource-consumption','mcp-prompt-consumption','remote-context-brokering']]
];
const profiles=rows.map(([id,title,skills])=>Object.freeze({id,title,category:'Repository & Coding Intelligence',skills,defaults:{readOnlyReasoning:true,mayAdvancePlan:false,mutationViaHostOnly:true}}));
global.CodeeRepositoryProfiles=Object.freeze(profiles);
})(typeof globalThis!=='undefined'?globalThis:this);
