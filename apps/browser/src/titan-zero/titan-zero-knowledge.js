(function attachTitanZeroKnowledge(global) {
    'use strict';

    const facts = Object.freeze([
        { id: 'host-laravel', topic: 'stack', text: 'Titan Zero host is a Laravel application and host-level development should follow Laravel service-container, routing, migration, Blade, and testing conventions already present in the repository.' },
        { id: 'php-floor', topic: 'stack', text: 'The scanned host requires PHP 8.2-compatible code; generated PHP should preserve the project composer constraints rather than assuming a newer language level.' },
        { id: 'livewire3', topic: 'frontend', text: 'Livewire 3 is part of the host stack; component state, actions, events, and rendered Blade templates may form one feature surface.' },
        { id: 'react19', topic: 'frontend', text: 'React 19 assets coexist with Blade/Livewire surfaces. Frontend impact analysis must not assume a single rendering technology.' },
        { id: 'alpine', topic: 'frontend', text: 'Alpine directives appear in Blade surfaces and can carry interaction state that must survive view refactors.' },
        { id: 'vite', topic: 'frontend', text: 'Vite owns browser asset compilation. Any changed JS/CSS entrypoint or imported dependency requires build verification.' },
        { id: 'tailwind', topic: 'frontend', text: 'Tailwind utility classes are part of the visual system; UI edits should preserve existing design tokens/patterns rather than introduce arbitrary CSS systems.' },
        { id: 'mixed-tenancy', topic: 'tenancy', text: 'Titan Zero core schema can contain tenant_company_id, company_id, and user_id ownership signals. Never infer one universal tenancy key.' },
        { id: 'ddl-only-default', topic: 'security', text: 'Database dumps may contain real business and credential data. Codee should analyze DDL/schema by default and avoid arbitrary INSERT-value extraction.' },
        { id: 'sensitive-columns', topic: 'security', text: 'Credential-like column names should be treated as redaction signals even when only schema metadata is being indexed.' },
        { id: 'migration-restartability', topic: 'database', text: 'Host migrations used in iterative development must be reviewed for partial-application and restartability behavior, not only first-run success.' },
        { id: 'mysql-identifiers', topic: 'database', text: 'MySQL identifiers have a 64-character limit; explicit or generated index/constraint names must be checked before packaging.' },
        { id: 'strict-timestamps', topic: 'database', text: 'Zero-date timestamp defaults can fail under strict MySQL modes and should be flagged during migration review.' },
        { id: 'route-names', topic: 'routing', text: 'Named routes can be consumed by Blade, navigation metadata, controllers, tests, and JavaScript; route renames require impact analysis.' },
        { id: 'container-bindings', topic: 'runtime', text: 'Service-provider bindings and constructor injection form runtime dependencies that static file edits can break even when PHP syntax is valid.' },
        { id: 'blade-cache', topic: 'frontend', text: 'Blade compilation is a useful validation step after template changes because syntax issues may not surface in JS/PHP linting.' },
        { id: 'navigation-safe-metadata', topic: 'navigation', text: 'Navigation analysis should consume explicitly supplied safe metadata rather than mining arbitrary SQL row values from production dumps.' },
        { id: 'impact-before-edit', topic: 'workflow', text: 'For Titan Zero host work, map ownership and downstream impact before editing. The smallest correct file set is preferred over broad refactors.' },
        { id: 'evidence-before-completion', topic: 'workflow', text: 'A successful artifact requires fresh targeted verification evidence appropriate to the files changed, not only a generic test-suite claim.' },
        { id: 'core-vs-extension-scope', topic: 'scope', text: 'Titan Zero intelligence treats app/Extensions/** as first-class repository code while preserving explicit core/extension ownership boundaries.' },
        { id: 'no-plan-authority', topic: 'authority', text: 'Titan Zero intelligence modules provide evidence/context only. They must never advance Codee multi-step plans.' },
        { id: 'no-mutation-authority', topic: 'authority', text: 'This pack does not write repository files or execute commands; mutations remain governed by the receiving Codee extension.' },
        { id: 'theme-parity', topic: 'frontend', text: 'Multiple view/theme families can represent the same conceptual page. UI changes should identify required parity rather than edit only the default family.' },
        { id: 'test-selection', topic: 'quality', text: 'Verification should be selected from change impact: migrations need schema checks, routes need route/container checks, frontend changes need build/view checks.' },
        { id: 'logs-as-evidence', topic: 'diagnostics', text: 'Runtime logs should be correlated with route/controller/service/provider context; stack traces are evidence, not a substitute for root-cause tracing.' },
        { id: 'config-cache', topic: 'runtime', text: 'Laravel config/route/view caching can make code and runtime state diverge; diagnosis should consider stale cache without blindly clearing it.' },
        { id: 'model-schema-drift', topic: 'database', text: 'Eloquent fillable/casts/table expectations should be compared against the supplied schema when diagnosing missing or mismatched data.' },
        { id: 'host-build-tools', topic: 'quality', text: 'Composer, Artisan, npm, Vite, and PHPUnit/Pest are complementary verification surfaces; the required subset depends on the change.' },
        { id: 'bounded-context', topic: 'context', text: 'Runner context must remain bounded and evidence-dense. Prefer targeted graph slices over dumping the entire 70+ MB repository into an AI context.' },
        { id: 'fact-vs-inference', topic: 'analysis', text: 'Titan Zero project reports should clearly separate observed repository/schema evidence from inferred architectural relationships.' }
    ]);

    const safetyRules = Object.freeze([
        'Include app/Extensions/** as first-class evidence while preserving extension ownership and tenancy boundaries.',
        'Ignore integration-sources/* and donor-extracted/* when generating Titan Zero host architecture context.',
        'Never read .env or expose credential values in prompts, diagnostics, exports, or test fixtures.',
        'Analyze database DDL/schema by default; do not extract arbitrary INSERT row values from supplied dumps.',
        'Do not assume tenant_company_id, company_id, or user_id is globally authoritative; resolve ownership from the affected domain/table.',
        'Do not execute shell, Artisan, Composer, npm, migration, or Git commands from this pack; emit governed recommendations only.',
        'Do not advance Codee plans or mark work complete; provide evidence to the receiving authoritative state machine.',
        'Require targeted verification evidence before recommending a release artifact.',
        'Prefer minimal host changes and preserve existing architecture/style patterns.',
        'Escalate destructive schema operations, container/provider changes, and sensitive-data handling to higher review/approval.'
    ]);

    const antiPatterns = Object.freeze([
        { id: 'global-tenancy-assumption', text: 'Replacing every company_id with tenant_company_id (or the reverse) without domain evidence.' },
        { id: 'route-only-edit', text: 'Changing a named route without checking navigation, Blade links, tests, and controller action resolution.' },
        { id: 'default-theme-only', text: 'Editing only one view family when equivalent surfaces exist elsewhere.' },
        { id: 'migration-first-run-only', text: 'Testing only a clean migration and not considering partial/retry/restart conditions.' },
        { id: 'php-lint-equals-runtime', text: 'Treating php -l as proof that Laravel container bindings, routes, views, and database behavior work.' },
        { id: 'full-dump-to-model', text: 'Sending an entire production SQL dump or secret-bearing configuration to an external model.' },
        { id: 'extension-boundary-collapse', text: 'Treating extension internals as if they share one implicit ownership/tenancy convention with core code.' }
    ]);

    global.CodeeTitanZeroKnowledge = Object.freeze({ facts, safetyRules, antiPatterns });
})(typeof globalThis !== 'undefined' ? globalThis : this);
