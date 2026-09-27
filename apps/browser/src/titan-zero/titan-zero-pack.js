(function attachTitanZeroCorePack(global) {
    'use strict';

    const DEFAULT_SETTINGS = Object.freeze({
        enabled: true,
        autoDetect: true,
        analyzeSqlSchema: true,
        maxContextChars: 12000,
        ignoreExtensions: false
    });

    function analyzeSnapshot(snapshot, settings) {
        const effectiveSettings = Object.assign({}, DEFAULT_SETTINGS, settings || {});
        const files = snapshot?.files || {};
        const filePaths = snapshot?.filePaths || Object.keys(files);
        const project = global.CodeeTitanZeroProjectDetector.detect(files, {
            profile: global.CodeeTitanZeroCoreProfile
        });
        const schema = effectiveSettings.analyzeSqlSchema && snapshot?.sqlText
            ? global.CodeeTitanZeroSqlAnalyzer.analyze(snapshot.sqlText, { profile: global.CodeeTitanZeroCoreProfile })
            : { parsed: false, totalTablesInDump: 0, analyzedCoreTables: 0, ignoredTables: 0, prefixCounts: {}, sensitiveColumnCount: 0, jsonColumnCount: 0, tenancy: {} };
        const routes = global.CodeeTitanZeroRouteAnalyzer.analyze(files);
        const themes = global.CodeeTitanZeroThemeAnalyzer.analyze(filePaths);
        const report = { project, schema, routes, themes };
        report.context = global.CodeeTitanZeroContext.build(report, { maxChars: effectiveSettings.maxContextChars });
        report.diagnostics = global.CodeeTitanZeroDiagnostics.build(report);
        return report;
    }

    function registrationDescriptor() {
        return {
            id: 'titan-zero-core-intelligence',
            version: '0.1.0',
            title: 'Titan Zero Core Intelligence',
            settings: Object.assign({}, DEFAULT_SETTINGS),
            placements: Object.assign({}, global.CodeeTitanZeroCoreProfile.preferredPlacements),
            prompts: global.CodeeTitanZeroPrompts.slice(),
            skills: global.CodeeTitanZeroSkills.slice(),
            contextProviders: [
                { id: 'titan-zero-runner-context', surface: 'runner', source: 'report.context' },
                { id: 'titan-zero-plan-preflight', surface: 'multi_step_plans', source: 'report.context' }
            ],
            diagnostics: { id: 'titan-zero-core', surface: 'diagnostics', source: 'report.diagnostics' },
            authority: {
                mayAdvancePlan: false,
                mayMutateRepository: false,
                mayInspectExtensions: true
            }
        };
    }

    global.CodeeTitanZeroCorePack = Object.freeze({
        DEFAULT_SETTINGS,
        analyzeSnapshot,
        registrationDescriptor
    });
})(typeof globalThis !== 'undefined' ? globalThis : this);
