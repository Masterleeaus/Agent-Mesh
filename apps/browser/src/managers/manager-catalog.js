(function(g){'use strict';
const frozenList=value=>Object.freeze([...(Array.isArray(value)?value:[])]);
const base=(id,name,role,tags,tools,risk='low')=>Object.freeze({
 id,name,role,
 tags:frozenList(tags),
 capabilities:frozenList([`manager.${id}.analyze`,`manager.${id}.recommend`]),
 tools:frozenList(tools),
 events:frozenList(['task.received','evidence.updated','verification.completed']),
 permissions:Object.freeze({read:true,requestMutation:true,directMutation:false,advancePlan:false}),
 autonomy:Object.freeze({analysis:'automatic',recommendation:'automatic',mutation:'host-governed',planAdvance:'forbidden'}),
 risk,
 dependencies:frozenList(['codee-repository-coding-intelligence','codee-mcp-runtime:optional'])
});
const M=Object.freeze([
base('architecture-manager','Architecture Manager','System boundaries, dependencies, design tradeoffs',['architecture'],['repository.dependencies','repository.impact','mcp.context.gather']),
base('laravel-manager','Laravel Manager','Laravel application structure and framework tracing',['laravel'],['repository.laravel.trace','repository.search','mcp.context.gather']),
base('database-manager','Database Manager','Schema, migrations, tenancy and query design',['database'],['repository.migrations.review','repository.impact','mcp.context.gather'],'medium'),
base('extension-manager','Extension Manager','Titan extension discovery, boundaries and integration',['extension'],['repository.inventory','repository.search','repository.dependencies','mcp.context.gather']),
base('frontend-manager','Frontend Manager','Blade, Livewire, React, JS, CSS and build surfaces',['frontend'],['repository.search','repository.dependencies','repository.tests.select']),
base('runtime-manager','Runtime Manager','Errors, logs, failures and runtime diagnosis',['runtime'],['repository.logs.analyze','repository.error.classify','mcp.context.gather']),
base('security-manager','Security Manager','Authentication, authorization, secrets and mutation risk',['security'],['repository.impact','mcp.context.gather'],'high'),
base('testing-manager','Testing Manager','Targeted test selection and verification evidence',['testing'],['repository.tests.select','repository.verification.plan']),
base('release-manager','Release Manager','Git readiness, packaging and release verification',['release'],['repository.git.analyze','repository.verification.plan'],'medium'),
base('integration-manager','Integration Manager','MCP/API/provider integration contracts',['integration'],['mcp.connections.list','mcp.discover','mcp.context.gather']),
base('repository-manager','Repository Manager','Files, symbols, diffs, impact and change sets',['repository'],['repository.search','repository.symbols','repository.diff','repository.impact'],'medium'),
base('planning-manager','Planning Manager','Initial plan drafting from evidence; never execution advancement',['planning'],['repository.inventory','repository.impact','mcp.context.gather']),
base('documentation-manager','Documentation Manager','Technical docs, architecture notes and handoff quality',['documentation'],['repository.search','mcp.context.gather']),
base('governance-manager','Governance Manager','Policy, approvals, backup/audit evidence and authority boundaries',['governance','security','release'],['repository.impact','repository.verification.plan'],'high')
]);
g.CodeeManagerCatalog=M;})(globalThis);
