(function attachRepositorySkills(global){
'use strict';
const raw=[
['repository-inventory','Repository Inventory',['inventory','scope','languages']],
['repository-search','Repository Search',['search','paths','bounded-results']],
['symbol-discovery','Symbol Discovery',['classes','functions','interfaces']],
['dependency-tracing','Dependency Tracing',['imports','references','dependents']],
['laravel-route-tracing','Laravel Route Tracing',['routes','controllers','services']],
['laravel-model-tracing','Laravel Model Tracing',['models','schema','consumers']],
['extension-architecture','Extension Architecture',['app/Extensions','providers','routes']],
['migration-safety','Migration Safety',['destructive-ddl','rollback','tenancy']],
['diff-analysis','Diff Analysis',['line-diff','exact-replacement']],
['change-impact','Change Impact',['dependents','risk-ranking']],
['change-set-tracking','Change Set Tracking',['receipts','hashes','verification']],
['backup-gated-mutation','Backup-Gated Mutation',['backup','checksum','authorization']],
['rollback-planning','Rollback Planning',['restore','pre-rollback-backup']],
['command-classification','Command Classification',['read','mutating','destructive']],
['targeted-testing','Targeted Testing',['phpunit','artisan','frontend-build']],
['verification-planning','Verification Planning',['evidence','checks','authority-boundary']],
['composer-analysis','Composer Analysis',['dependencies','scripts','constraints']],
['npm-analysis','NPM Analysis',['dependencies','scripts','engines']],
['git-state-analysis','Git State Analysis',['status','diff','conflicts']],
['runtime-log-analysis','Runtime Log Analysis',['laravel-log','redaction','severity']],
['error-classification','Error Classification',['database','routing','container','frontend']],
['mcp-tool-consumption','MCP Tool Consumption',['discover','call-tool','provenance']],
['mcp-resource-consumption','MCP Resource Consumption',['read-resource','bounded-context']],
['mcp-prompt-consumption','MCP Prompt Consumption',['get-prompt','arguments']],
['remote-context-brokering','Remote Context Brokering',['titan-mcp','laravel-docs','provenance']],
['secret-protection','Secret Protection',['redaction','blocked-paths','credentials']],
['path-safety','Repository Path Safety',['normalization','scope','no-traversal']],
['release-evidence','Release Evidence',['tests','hashes','artifacts','rollback']]
];
const skills=raw.map(([id,title,capabilities])=>Object.freeze({id,title,category:'Repository & Coding Intelligence',capabilities,policy:{planAdvance:false,privilegedExecution:'host-owned',backupBeforeMutation:true}}));
global.CodeeRepositorySkills=Object.freeze(skills);
})(typeof globalThis!=='undefined'?globalThis:this);
