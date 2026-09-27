(function attachTitanZeroDeveloperPack(global) {
    'use strict';

    const DEFAULT_SETTINGS = Object.freeze({
        enabled: true,
        autoDetect: true,
        analyzeSqlSchema: true,
        analyzeMigrations: true,
        analyzeTenancy: true,
        analyzeNavigationMetadata: true,
        analyzeFrontend: true,
        maxContextChars: 18000,
        ignoreExtensions: false,
        parseSqlRows: false
    });

    function buildContext(report, maxChars) {
        const project = report.project || {};
        const stack = project.stack || {};
        const schema = report.schemaGraph || {};
        const migrations = report.migrations || {};
        const tenancy = report.tenancy || {};
        const architecture = report.architecture || {};
        const frontend = report.frontend || {};
        const navigation = report.navigation || {};
        const routes = report.routes || {};
        const lines = [
            '# Titan Zero Developer Intelligence',
            '',
            'Use this as bounded Titan Zero project evidence. Core and app/Extensions/** code are both in scope; secret values remain excluded.',
            '',
            '## Host stack',
            `- Recognized: ${project.recognized ? 'yes' : 'no'} (${Math.round((project.confidence || 0) * 100)}% confidence)`,
            `- PHP: ${stack.php || 'unknown'}`,
            `- Laravel: ${stack.laravel || 'unknown'}`,
            `- Livewire: ${stack.livewire || 'unknown'}`,
            `- React: ${stack.react || 'unknown'}`,
            `- Vite: ${stack.vite || 'unknown'}`,
            `- Tailwind: ${stack.tailwind || 'unknown'}`,
            '',
            '## Repository schema',
            `- Tables analyzed: ${schema.stats?.analyzedTables || 0}`,
            `- Tables ignored by explicit policy: ${schema.stats?.ignoredTables || 0}`,
            `- Columns: ${schema.stats?.columns || 0}`,
            `- Indexes: ${schema.stats?.indexes || 0}`,
            `- Foreign keys: ${schema.stats?.foreignKeys || 0}`,
            `- Sensitive column names: ${schema.sensitiveColumns?.length || 0}`,
            '',
            '## Migration safety',
            `- Migration files analyzed: ${migrations.filesAnalyzed || 0}`,
            `- Findings: ${migrations.risks?.length || 0}`,
            `- Highest severity: ${migrations.highestSeverity || 'none'}`,
            '',
            '## Tenancy',
            `- tenant_company_id tables: ${tenancy.boundaries?.tenant_company?.tables?.length || 0}`,
            `- company_id tables: ${tenancy.boundaries?.company?.tables?.length || 0}`,
            `- user_id tables: ${tenancy.boundaries?.user?.tables?.length || 0}`,
            `- Mixed company boundary: ${tenancy.mixedBoundary ? 'yes — resolve ownership per domain' : 'no'}`,
            '',
            '## Runtime architecture',
            `- Controllers: ${architecture.controllers?.length || 0}`,
            `- Models: ${architecture.models?.length || 0}`,
            `- Services: ${architecture.services?.length || 0}`,
            `- Service providers: ${architecture.serviceProviders?.length || 0}`,
            `- Explicit container bindings: ${architecture.containerBindings?.length || 0}`,
            `- Routes: ${routes.totalRouteCalls || 0} declarations / ${routes.namedRoutes || 0} named`,
            `- Model/schema drift findings: ${report.modelSchema?.findings?.length || 0}`,
            `- Sensitive config env names: ${report.config?.sensitiveEnvKeys?.length || 0}`,
            `- Risk rules triggered: ${report.risks?.map(risk => risk.code).join(', ') || 'none'}`,
            '',
            '## Frontend',
            `- Blade files: ${frontend.bladeFiles || 0}`,
            `- Livewire components: ${frontend.livewire?.components?.length || 0}`,
            `- React files: ${frontend.reactFiles?.length || 0}`,
            `- Alpine-bearing views: ${frontend.alpineFiles?.length || 0}`,
            `- Theme families: ${(frontend.themeFamilies || []).map(theme => `${theme.name}(${theme.viewFiles})`).slice(0, 10).join(', ') || 'none'}`,
            '',
            '## Navigation metadata',
            `- Items supplied: ${navigation.items || 0}`,
            `- Broken parents: ${navigation.brokenParents?.length || 0}`,
            `- Missing named routes: ${navigation.missingRoutes?.length || 0}`,
            `- Missing permissions: ${navigation.missingPermissions?.length || 0}`,
            '',
            '## Non-negotiable safety',
            ...((global.CodeeTitanZeroKnowledge?.safetyRules || []).map(rule => `- ${rule}`))
        ];
        const limit = Math.max(4000, Number(maxChars || DEFAULT_SETTINGS.maxContextChars));
        const text = lines.join('\n');
        return text.length <= limit ? text : `${text.slice(0, limit - 48)}\n\n[context truncated to configured Titan limit]`;
    }

    function analyzeSnapshot(snapshot, settings) {
        const effective = Object.assign({}, DEFAULT_SETTINGS, settings || {});
        const files = snapshot?.files || {};
        const filePaths = snapshot?.filePaths || Object.keys(files);
        const project = global.CodeeTitanZeroProjectDetector.detect(files, { profile: global.CodeeTitanZeroCoreProfile });
        const routes = global.CodeeTitanZeroRouteAnalyzer.analyze(files);
        const legacySchema = effective.analyzeSqlSchema && snapshot?.sqlText ? global.CodeeTitanZeroSqlAnalyzer.analyze(snapshot.sqlText, { profile: global.CodeeTitanZeroCoreProfile }) : { parsed: false };
        const schemaGraph = effective.analyzeSqlSchema && snapshot?.sqlText ? global.CodeeTitanZeroSchemaGraph.build(snapshot.sqlText, { profile: global.CodeeTitanZeroCoreProfile }) : { parsed: false, tables: [], tableMap: {}, indexes: [], foreignKeys: [], sensitiveColumns: [], stats: {} };
        const migrations = effective.analyzeMigrations ? global.CodeeTitanZeroMigrationAnalyzer.analyze(files, { schemaGraph }) : { filesAnalyzed: 0, files: [], risks: [], highestSeverity: 'none' };
        const tenancy = effective.analyzeTenancy ? global.CodeeTitanZeroTenancyAnalyzer.analyze(schemaGraph, files) : { boundaries: {}, mixedBoundary: false, files: [] };
        const architecture = global.CodeeTitanZeroPhpArchitecture.analyze(files);
        const frontend = effective.analyzeFrontend ? global.CodeeTitanZeroFrontendAnalyzer.analyze(files) : { bladeFiles: 0, livewire: { components: [] }, reactFiles: [], alpineFiles: [], themeFamilies: [] };
        const themes = global.CodeeTitanZeroThemeAnalyzer.analyze(filePaths);
        const navigation = effective.analyzeNavigationMetadata ? global.CodeeTitanZeroNavigationAnalyzer.analyze({ navigation: snapshot?.navigation, permissions: snapshot?.permissions }, routes) : { items: 0, brokenParents: [], missingRoutes: [], missingPermissions: [] };
        const modelSchema = effective.analyzeSqlSchema
            ? global.CodeeTitanZeroModelSchemaAnalyzer.analyze(files, schemaGraph)
            : { models: [], findings: [], missingTables: [], driftCount: 0, skipped: true };
        const routeConsumers = global.CodeeTitanZeroRouteConsumerIndex.analyze(files, routes);
        const versions = global.CodeeTitanZeroVersionAnalyzer.analyze(files);
        const config = global.CodeeTitanZeroConfigAnalyzer.analyze(files);
        const report = { project, schema: legacySchema, schemaGraph, migrations, tenancy, architecture, routes, frontend, themes, navigation, modelSchema, routeConsumers, versions, config, settings: effective };
        report.projectGraph = global.CodeeTitanZeroProjectGraph.build(report, files);
        report.risks = global.CodeeTitanZeroRiskRules.evaluate(report);
        report.runtimeDiagnostics = global.CodeeTitanZeroRuntimeDiagnostics.build(report);
        report.diagnostics = report.runtimeDiagnostics;
        report.context = buildContext(report, effective.maxContextChars);
        return report;
    }

    function registrationDescriptor() {
        const prompts = [...(global.CodeeTitanZeroPrompts || []), ...(global.CodeeTitanZeroDevelopmentPrompts || [])];
        const skills = [...(global.CodeeTitanZeroSkills || []), ...(global.CodeeTitanZeroDevelopmentSkills || [])];
        const profiles = [...(global.CodeeTitanZeroDevelopmentProfiles || [])];
        return {
            id: 'titan-zero-developer-intelligence',
            version: '1.0.0',
            title: 'Titan Zero Developer Intelligence Mega Pack',
            type: 'codee_capability_pack',
            settings: Object.assign({}, DEFAULT_SETTINGS),
            placements: {
                runner: 'context_provider',
                plans: 'preflight_context_provider',
                prompts: 'category:Titan Zero Development',
                skills: 'category:Titan Zero Development',
                settings: 'section:Titan Zero',
                diagnostics: 'section:Titan Zero'
            },
            prompts,
            skills,
            profiles,
            commands: [...(global.CodeeTitanZeroCommandCatalog?.COMMANDS || [])],
            contextProviders: [
                { id: 'titan-zero-runner-context', surface: 'runner', source: 'CodeeTitanZeroHostIntegration.analyze(...).context' },
                { id: 'titan-zero-plan-preflight', surface: 'multi_step_plans', source: 'CodeeTitanZeroHostIntegration.analyze(...).context' }
            ],
            diagnostics: { id: 'titan-zero-developer-intelligence', surface: 'diagnostics', source: 'report.runtimeDiagnostics' },
            analyzers: [
                'project', 'schemaGraph', 'migrationSafety', 'tenancy', 'phpArchitecture', 'routes', 'routeConsumers', 'navigation', 'frontend', 'themes', 'modelSchema', 'versions', 'config', 'projectGraph', 'riskRules', 'impact', 'contextSelector', 'testMatrix', 'errorClassifier', 'commandCatalog'
            ],
            authority: {
                mayAdvancePlan: false,
                mayMutateRepository: false,
                mayExecuteCommands: false,
                mayInspectExtensions: true
            }
        };
    }

    global.CodeeTitanZeroDeveloperPack = Object.freeze({ DEFAULT_SETTINGS, analyzeSnapshot, buildContext, registrationDescriptor });
})(typeof globalThis !== 'undefined' ? globalThis : this);
