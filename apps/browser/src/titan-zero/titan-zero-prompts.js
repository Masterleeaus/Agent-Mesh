(function attachTitanZeroPrompts(global) {
    'use strict';

    const PROMPTS = Object.freeze([
        {
            id: 'titan-zero-core-architecture-scan',
            title: 'Titan Zero Core Architecture Scan',
            category: 'Titan Zero Core',
            description: 'Map the host application architecture including extension internals as first-class project code.',
            text: 'Inspect the Titan Zero application repository, including app/Extensions/** as first-class code while preserving extension ownership boundaries. Ignore donor/integration source trees and secret-bearing/generated paths. Map core domains, controllers, services, jobs, models, route surfaces, themes, build tooling, service providers, and database ownership signals. Separate observed facts from inference. Identify the smallest authoritative file set for the requested change before proposing edits.'
        },
        {
            id: 'titan-zero-database-impact',
            title: 'Titan Zero Database Impact Analysis',
            category: 'Titan Zero Core',
            description: 'Determine schema, model, migration, tenancy, and query impact before changing the database.',
            text: 'Analyze the requested Titan Zero database change against the supplied schema. Include extension-owned schema and migration surfaces; preserve explicit domain/extension ownership when interpreting tables. Identify affected tables, columns, indexes, models, queries, migrations, validation, API/resources, and tenancy/ownership rules. Do not expose INSERT data or credential values. State rollback and verification requirements before code changes.'
        },
        {
            id: 'titan-zero-runtime-root-cause',
            title: 'Titan Zero Runtime Root Cause',
            category: 'Titan Zero Core',
            description: 'Trace Laravel runtime failures through routes, container bindings, controllers, services, and views.',
            text: 'Investigate this Titan Zero host runtime failure systematically. Include relevant app/Extensions/** providers, routes, controllers, services, models, migrations, views and manifests when they participate in the failure. Trace the error from route/request through middleware, controller/Livewire action, service/container binding, model/query, Blade/React asset, and storage/cache state. Identify root cause evidence before proposing a fix and provide exact verification commands.'
        },
        {
            id: 'titan-zero-route-ui-impact',
            title: 'Titan Zero Route and UI Impact',
            category: 'Titan Zero Core',
            description: 'Map route, controller, theme, Blade/Livewire/React, and navigation consequences of a UI change.',
            text: 'Before editing Titan Zero UI, map the core route, controller/action, Blade or Livewire surface, React/Vite entrypoints, theme/view-family overrides, permissions, and database-backed navigation dependencies. Include relevant app/Extensions/** surfaces and preserve their ownership boundaries. Preserve the existing visual language and identify all view families that require parity.'
        },
        {
            id: 'titan-zero-safe-core-change-review',
            title: 'Titan Zero Safe Core Change Review',
            category: 'Titan Zero Core',
            description: 'Review a proposed host-level change for unnecessary core mutation and regression risk.',
            text: 'Review this proposed Titan Zero host change before implementation. Confirm the change belongs in core rather than an extension or configuration surface, identify the smallest file set, assess database/route/theme/provider impact, check tenant isolation and secret exposure, define targeted tests, and provide rollback steps. Prefer preserving existing patterns over broad refactors.'
        },
        {
            id: 'titan-zero-release-verification',
            title: 'Titan Zero Core Release Verification',
            category: 'Titan Zero Core',
            description: 'Build an evidence-based verification matrix for a host-level change.',
            text: 'Create a Titan Zero core verification matrix from the actual files changed. Include PHP syntax/Pint where relevant, targeted Pest/PHPUnit tests, route/container checks, migration status or rollback checks when schema changed, Blade/Livewire/React/Vite validation when UI changed, cache/config/view rebuild checks, and clean-artifact verification. Do not claim success without fresh command output.'
        }
    ]);

    global.CodeeTitanZeroPrompts = PROMPTS;
})(typeof globalThis !== 'undefined' ? globalThis : this);
