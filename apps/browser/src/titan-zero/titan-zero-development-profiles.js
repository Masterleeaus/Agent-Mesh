(function attachTitanZeroDevelopmentProfiles(global) {
    'use strict';

    function profile(id, name, domain, mission, skills, tools, risk) {
        return Object.freeze({
            id,
            name,
            family: 'Titan Zero Development',
            domain,
            version: '1.0.0',
            mission,
            skills: Object.freeze(skills.slice()),
            declaredTools: Object.freeze((tools || []).slice()),
            contextPolicy: Object.freeze({ includeTitanProjectContext: true, includeExtensions: true, includeSqlRowValues: false, maxContextChars: 18000 }),
            authority: Object.freeze({ mayAdvancePlan: false, mayMutateRepository: false, mayExecuteCommands: false }),
            risk: risk || 'medium',
            verificationPolicy: Object.freeze({ evidenceBeforeCompletion: true, requireTargetedMatrix: true })
        });
    }

    const PROFILES = Object.freeze([
        profile('tz-systems-architect', 'Titan Zero Systems Architect', 'architecture', 'Map Titan Zero host ownership, dependencies and minimal change boundaries before implementation.', ['tz-architecture-recon','tz-impact-before-edit','tz-core-refactor','tz-context-selection'], ['repository.read','repository.search','schema.read'], 'high'),
        profile('tz-laravel-engineer', 'Titan Zero Laravel Engineer', 'runtime', 'Develop and debug Laravel host code across routes, controllers, services, providers and jobs.', ['tz-route-analysis','tz-container-analysis','tz-runtime-tracing','tz-test-selection'], ['repository.read','repository.search','diagnostics.read'], 'high'),
        profile('tz-database-engineer', 'Titan Zero Database Engineer', 'database', 'Analyze core schema, queries, indexes, Eloquent models and data ownership without exposing row values.', ['tz-schema-graph','tz-model-schema','tz-query-audit','tz-tenancy-resolution'], ['schema.read','repository.read','repository.search'], 'high'),
        profile('tz-migration-engineer', 'Titan Zero Migration Engineer', 'database', 'Design and review restartable MySQL/Laravel schema changes against the actual host schema.', ['tz-migration-safety','tz-schema-drift','tz-release-gate','tz-regression-design'], ['schema.read','repository.read','diagnostics.read'], 'critical'),
        profile('tz-tenancy-auditor', 'Titan Zero Tenancy Auditor', 'tenancy', 'Prevent cross-company/tenant/user data leakage by resolving ownership boundaries from evidence.', ['tz-tenancy-resolution','tz-query-audit','tz-security-review','tz-completion-evidence'], ['schema.read','repository.read','repository.search'], 'critical'),
        profile('tz-frontend-engineer', 'Titan Zero Frontend Engineer', 'frontend', 'Develop Blade, Livewire, React, Alpine, Tailwind and Vite surfaces while preserving theme parity.', ['tz-blade-impact','tz-livewire3-review','tz-react-vite-review','tz-tailwind-parity','tz-theme-parity'], ['repository.read','repository.search','frontend.build.recommend'], 'medium'),
        profile('tz-navigation-engineer', 'Titan Zero Navigation and Routing Engineer', 'navigation', 'Maintain route, menu, permission and controller consistency across the host UI.', ['tz-route-analysis','tz-navigation-analysis','tz-security-review','tz-test-selection'], ['repository.read','navigation.read','permissions.read'], 'high'),
        profile('tz-runtime-debugger', 'Titan Zero Runtime Debugger', 'diagnostics', 'Trace production/runtime defects to the earliest causal host component.', ['tz-runtime-tracing','tz-http500-triage','tz-cache-state','tz-production-diagnostics'], ['logs.read.sanitized','repository.read','diagnostics.read'], 'high'),
        profile('tz-security-auditor', 'Titan Zero Security Auditor', 'security', 'Audit host changes for authorization, tenant isolation, secret handling and client/server trust boundaries.', ['tz-security-review','tz-secret-guard','tz-tenancy-resolution','tz-query-audit'], ['repository.read','schema.read','diagnostics.read'], 'critical'),
        profile('tz-performance-engineer', 'Titan Zero Performance Engineer', 'performance', 'Find evidence-backed host performance bottlenecks without speculative rewrites.', ['tz-performance-review','tz-query-audit','tz-react-vite-review','tz-livewire3-review'], ['repository.read','repository.search','diagnostics.read'], 'medium'),
        profile('tz-test-engineer', 'Titan Zero Test Engineer', 'quality', 'Design targeted regression and verification matrices from actual host impact.', ['tz-test-selection','tz-regression-design','tz-completion-evidence','tz-plan-preflight'], ['repository.read','tests.read','diagnostics.read'], 'medium'),
        profile('tz-production-doctor', 'Titan Zero Production Doctor', 'diagnostics', 'Assemble safe evidence bundles and triage host incidents without leaking secrets.', ['tz-production-diagnostics','tz-http500-triage','tz-cache-state','tz-secret-guard'], ['logs.read.sanitized','diagnostics.read','schema.read'], 'high'),
        profile('tz-release-engineer', 'Titan Zero Release Engineer', 'release', 'Gate Titan Zero host releases on targeted verification, rollback evidence and clean artifact integrity.', ['tz-release-gate','tz-test-selection','tz-completion-evidence','tz-migration-safety'], ['artifact.read','tests.read','diagnostics.read'], 'critical'),
        profile('tz-plan-reviewer', 'Titan Zero Multi-Step Plan Reviewer', 'workflow', 'Preflight Codee development plans against Titan Zero host architecture before execution.', ['tz-plan-preflight','tz-impact-before-edit','tz-context-selection','tz-completion-evidence'], ['plan.read','repository.read','schema.read'], 'high')
    ]);

    global.CodeeTitanZeroDevelopmentProfiles = PROFILES;
})(typeof globalThis !== 'undefined' ? globalThis : this);
