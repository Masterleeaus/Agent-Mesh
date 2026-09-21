(function attachTitanZeroCoreProfile(global) {
    'use strict';

    const PROFILE = Object.freeze({
        id: 'titan-zero-core',
        name: 'Titan Zero Core',
        version: '0.1.0',
        mode: 'read_only_project_intelligence',
        ignoredPaths: Object.freeze([
            'integration-sources/',
            'donor-extracted/'
        ]),
        ignoredTablePrefixes: Object.freeze([]),
        recognition: Object.freeze({
            requiredAny: Object.freeze([
                'artisan',
                'composer.json',
                'routes/panel.php',
                'config/themes.php'
            ]),
            strongMarkers: Object.freeze([
                'app/Domains/Titan/',
                'app/Http/Controllers/TitanWorkspaceProjectController.php',
                'packages/magicai/magicai-updater/',
                'config/magicaiupdater.php'
            ])
        }),
        expectedStack: Object.freeze({
            php: '^8.2',
            laravel: '^10.0',
            livewire: '^3.5',
            react: '^19',
            vite: '^7',
            tailwind: '^3.4'
        }),
        preferredPlacements: Object.freeze({
            runner: 'context_provider',
            plans: 'preflight_context_provider',
            prompts: 'category:Titan Zero Core',
            skills: 'category:Titan Zero Core',
            settings: 'section:Titan Zero',
            diagnostics: 'section:Titan Zero'
        }),
        safety: Object.freeze({
            ignoreExtensionInternals: false,
            includeExtensionInternals: true,
            mutationAuthority: false,
            planAdvanceAuthority: false,
            parseSqlDdlOnly: true,
            redactSensitiveValues: true
        })
    });

    global.CodeeTitanZeroCoreProfile = PROFILE;
})(typeof globalThis !== 'undefined' ? globalThis : this);
