(function attachRepositoryPrompts(global){
'use strict';
const defs=[
['repo-understand-task','Understand Repository Task','Restate the requested change, identify affected domains, list assumptions, and request repository/MCP evidence before proposing edits.'],
['repo-find-implementation','Find Implementation','Locate the implementation path for the requested behavior using symbols, routes, services, models, views and extension code.'],
['repo-impact-review','Change Impact Review','Analyze direct and transitive consumers of the proposed changed files and identify migration, tenancy, permission, UI and integration risks.'],
['repo-safe-edit','Safe Repository Edit','Prepare the smallest coherent file set, exact edits, backup scope and verification plan. Do not execute or advance the plan.'],
['repo-debug-laravel','Laravel Runtime Debug','Classify the error, trace route/container/model/service dependencies, inspect logs, and identify the earliest evidence-backed failure point.'],
['repo-debug-frontend','Frontend Runtime Debug','Trace Blade/Livewire/React/Vite dependencies and identify the smallest evidence-backed repair.'],
['repo-migration-review','Migration Safety Review','Review migration operations, rollback coverage, tenancy boundaries, data compatibility and deployment ordering.'],
['repo-route-trace','Route Trace','Trace named route or URI to controller/action, middleware, services, models, views and relevant tests.'],
['repo-model-trace','Model Trace','Trace a model to schema, relationships, services, policies, jobs, controllers and extension consumers.'],
['repo-extension-trace','Extension Trace','Treat app/Extensions as first-class code and map the extension manifest/providers/routes/services/models/migrations/UI dependencies.'],
['repo-test-plan','Targeted Test Plan','Select the smallest test/build/lint matrix that proves the changed behavior and catches likely regressions.'],
['repo-diff-review','Diff Review','Review a proposed diff for correctness, hidden collateral changes, security, tenancy, backwards compatibility and missing tests.'],
['repo-git-review','Git State Review','Interpret branch/status/diff evidence and identify conflicts, unrelated modifications and unsafe integration state.'],
['repo-dependency-review','Dependency Review','Review Composer/npm dependency changes, scripts, version constraints and runtime compatibility before mutation.'],
['repo-config-review','Configuration Review','Inspect safe configuration structure and environment variable names without exposing secret values.'],
['repo-log-triage','Log Triage','Cluster recent errors by root-cause area and rank the next evidence-gathering action.'],
['repo-backup-scope','Backup Scope','Declare every file/database/server target that must be captured and verified before a mutation is authorized.'],
['repo-rollback-plan','Rollback Plan','Produce rollback steps from backup receipts and require a fresh pre-rollback backup before restore.'],
['repo-mcp-context','MCP Context Request','Choose the minimum MCP tools/resources required to resolve missing live-server facts and label all returned provenance.'],
['repo-release-readiness','Release Readiness','Verify change set, tests, artifacts, migrations, runtime diagnostics, backup/rollback evidence and unresolved risks.'],
['repo-refactor-safety','Refactor Safety','Map callers and contracts first, preserve observable behavior, and require focused regressions around every changed boundary.'],
['repo-security-review','Repository Security Review','Check secret handling, path traversal, command execution, auth/permission boundaries and unsafe dynamic execution.'],
['repo-performance-review','Performance Review','Identify likely query, rendering, build or hot-path costs and request profiling evidence before optimization.'],
['repo-plan-bootstrap','Plan Bootstrap','Use repository and MCP evidence to create an implementation plan; once approved, hand execution to Codee core without taking plan authority.']
];
const prompts=defs.map(([id,title,instruction])=>Object.freeze({id,title,category:'Repository & Coding Intelligence',instruction,variables:['task','project_context','repository_evidence','mcp_evidence'],authority:{mayAdvancePlan:false}}));
global.CodeeRepositoryPrompts=Object.freeze(prompts);
})(typeof globalThis!=='undefined'?globalThis:this);
