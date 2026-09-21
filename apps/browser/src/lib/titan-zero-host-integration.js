(function attachCodeeTitanZeroHostIntegration(global) {
    'use strict';

    const CAPABILITY_ID = 'titan-zero-developer-intelligence';
    const DEFAULTS = Object.freeze({
        enabled: true,
        autoDetect: true,
        analyzeSqlSchema: true,
        analyzeMigrations: true,
        analyzeTenancy: true,
        analyzeNavigationMetadata: true,
        analyzeFrontend: true,
        maxContextChars: 18000,
        includeExtensions: true,
        ignoreExtensions: false,
        parseSqlRows: false
    });
    const SENSITIVE_KEY = /(password|passwd|secret|token|api[_-]?key|private[_-]?key|access[_-]?key|refresh[_-]?token|credential|client[_-]?secret|webhook[_-]?secret)/i;
    const SAFE_NAV_KEYS = new Set(['id','parent_id','parentId','title','name','label','route','route_name','permission','type','active','sort','order','group','icon','url']);
    const SNAPSHOT_LIMITS = Object.freeze({
        maxFiles: 12000,
        maxFileChars: 2 * 1024 * 1024,
        maxTotalChars: 32 * 1024 * 1024,
        maxSqlChars: 32 * 1024 * 1024,
        maxNavigationRows: 5000,
        maxNavigationValueChars: 500,
        maxPermissions: 10000,
        maxPathChars: 1024,
        maxTaskChars: 8000,
        maxChangedPaths: 5000
    });

    function normalizeSettings(value) {
        const input = value && typeof value === 'object' ? value : {};
        const number = Number(input.maxContextChars);
        return {
            enabled: input.enabled !== false,
            autoDetect: input.autoDetect !== false,
            analyzeSqlSchema: input.analyzeSqlSchema !== false,
            analyzeMigrations: input.analyzeMigrations !== false,
            analyzeTenancy: input.analyzeTenancy !== false,
            analyzeNavigationMetadata: input.analyzeNavigationMetadata !== false,
            analyzeFrontend: input.analyzeFrontend !== false,
            maxContextChars: Number.isFinite(number) ? Math.min(50000, Math.max(4000, Math.round(number))) : DEFAULTS.maxContextChars,
            includeExtensions: true,
            ignoreExtensions: false,
            parseSqlRows: false
        };
    }

    function hasUnsafePathSegments(path) {
        const raw = String(path || '').replace(/\\/g, '/');
        if (!raw || raw.length > SNAPSHOT_LIMITS.maxPathChars || raw.includes('\0') || raw.startsWith('/') || /^[A-Za-z]:\//.test(raw)) return true;
        return raw.split('/').some(segment => segment === '..');
    }

    function normalizePath(path) {
        const raw = String(path || '').replace(/\\/g, '/');
        return raw.split('/').filter(segment => segment && segment !== '.').join('/');
    }

    function shouldIgnorePath(path) {
        if (hasUnsafePathSegments(path)) return true;
        const normalized = normalizePath(path);
        const lower = normalized.toLowerCase();
        if (!normalized) return true;
        if (global.CodeeTitanZeroSnapshotPolicy?.shouldIgnore?.(normalized)) return true;
        return lower === '.env'
            || lower.startsWith('.env.')
            || lower.startsWith('node_modules/')
            || lower.includes('/node_modules/')
            || lower.startsWith('vendor/')
            || lower.includes('/vendor/')
            || lower.startsWith('storage/logs/')
            || lower.endsWith('.log')
            || lower.startsWith('.git/')
            || lower.startsWith('integration-sources/')
            || lower.startsWith('donor-extracted/');
    }


    const ALLOWED_ROOT_FILES = new Set(['artisan', 'composer.json', 'package.json', 'phpunit.xml', 'phpunit.xml.dist']);
    const ALLOWED_PREFIXES = Object.freeze([
        'routes/', 'config/', 'app/domains/', 'app/http/controllers/', 'app/http/middleware/',
        'app/livewire/', 'app/models/', 'app/providers/', 'app/services/', 'app/jobs/', 'app/policies/', 'app/extensions/',
        'resources/views/', 'resources/js/', 'database/migrations/', 'tests/'
    ]);

    function shouldIncludePath(path) {
        if (hasUnsafePathSegments(path)) return false;
        const normalized = normalizePath(path);
        const lower = normalized.toLowerCase();
        if (shouldIgnorePath(normalized)) return false;
        if (ALLOWED_ROOT_FILES.has(lower)) return true;
        if (/^(?:vite|tailwind|postcss)\.config\.(?:js|cjs|mjs|ts)$/i.test(normalized)) return true;
        return ALLOWED_PREFIXES.some(prefix => lower.startsWith(prefix));
    }

    function splitSqlStatements(sqlText, options) {
        const sql = String(sqlText || '');
        const ddlCandidatesOnly = options?.ddlCandidatesOnly === true;
        const statements = [];
        let current = '';
        let quote = null;
        let lineComment = false;
        let blockComment = false;
        let statementMode = ddlCandidatesOnly ? 'unknown' : 'collect';
        const append = value => { if (statementMode !== 'discard') current += value; };
        const updateMode = (force = false) => {
            if (!ddlCandidatesOnly || statementMode !== 'unknown') return;
            const source = current.trimStart();
            const match = force ? source.match(/^([A-Za-z]+)/) : source.match(/^([A-Za-z]+)\s/);
            if (!match) return;
            statementMode = /^(?:CREATE|ALTER|DROP|RENAME)$/i.test(match[1]) ? 'collect' : 'discard';
            if (statementMode === 'discard') current = '';
        };
        const reset = () => {
            current = '';
            statementMode = ddlCandidatesOnly ? 'unknown' : 'collect';
        };
        for (let index = 0; index < sql.length; index += 1) {
            const ch = sql[index];
            const next = sql[index + 1];
            if (lineComment) {
                if (ch === '\n' || ch === '\r') lineComment = false;
                continue;
            }
            if (blockComment) {
                if (ch === '*' && next === '/') { blockComment = false; index += 1; }
                continue;
            }
            if (quote) {
                append(ch);
                if (ch === '\\' && index + 1 < sql.length) {
                    append(sql[index + 1]);
                    index += 1;
                    continue;
                }
                if (ch === quote) {
                    if (sql[index + 1] === quote) { append(sql[index + 1]); index += 1; }
                    else quote = null;
                }
                continue;
            }
            if (ch === '-' && next === '-') { lineComment = true; index += 1; continue; }
            if (ch === '#') { lineComment = true; continue; }
            if (ch === '/' && next === '*') { blockComment = true; index += 1; continue; }
            if (ch === "'" || ch === '"' || ch === '`') { quote = ch; append(ch); continue; }
            if (ch === ';') {
                updateMode(true);
                if (statementMode !== 'discard' && current.trim()) statements.push(current.trim());
                reset();
                continue;
            }
            append(ch);
            updateMode();
        }
        updateMode(true);
        if (statementMode !== 'discard' && current.trim()) statements.push(current.trim());
        return statements;
    }

    function extractDdlOnly(sqlText) {
        const allowed = /^(?:CREATE\s+TABLE|ALTER\s+TABLE|CREATE\s+(?:UNIQUE\s+)?INDEX|DROP\s+TABLE|RENAME\s+TABLE|CREATE\s+VIEW|DROP\s+VIEW)\b/i;
        return splitSqlStatements(sqlText, { ddlCandidatesOnly: true })
            .filter(statement => allowed.test(statement))
            .map(statement => `${statement};`)
            .join('\n');
    }

    function sanitizeNavigation(rows) {
        if (!Array.isArray(rows)) return [];
        return rows.slice(0, SNAPSHOT_LIMITS.maxNavigationRows).map(row => {
            const safe = {};
            if (!row || typeof row !== 'object') return safe;
            for (const [key, value] of Object.entries(row)) {
                if (!SAFE_NAV_KEYS.has(key) || SENSITIVE_KEY.test(key)) continue;
                if (value === null || typeof value === 'number' || typeof value === 'boolean') {
                    safe[key] = value;
                    continue;
                }
                if (typeof value !== 'string') continue;
                let text = value.slice(0, SNAPSHOT_LIMITS.maxNavigationValueChars);
                if (key === 'url') text = text.split(/[?#]/, 1)[0];
                safe[key] = text;
            }
            return safe;
        });
    }

    function sanitizePermissions(values) {
        if (!Array.isArray(values)) return [];
        return values.slice(0, SNAPSHOT_LIMITS.maxPermissions)
            .filter(value => value === null || ['string','number','boolean'].includes(typeof value))
            .map(value => String(value ?? '').slice(0, 240)).filter(Boolean);
    }

    function redactSourceText(value) {
        const text = String(value ?? '');
        if (global.CodeeRepositoryPolicy?.redactText) return global.CodeeRepositoryPolicy.redactText(text);
        return text
            .replace(/(Bearer\s+)[A-Za-z0-9._~+\/-]+/ig, '$1[redacted]')
            .replace(/((?:[\"']?)(?:api[_-]?key|secret|password|passwd|token|authorization|client[_-]?secret|access[_-]?key|refresh[_-]?token)(?:[\"']?)\s*(?:=>|[:=])\s*)([\"'])[^\"'\r\n]*\2/ig, '$1$2[redacted]$2')
            .replace(/(\b(?:postgres(?:ql)?|mysql|mariadb|mongodb(?:\+srv)?|redis|rediss):\/\/[^\s:@/\"']+:)[^@\s/\"']+(@)/ig, '$1[redacted]$2');
    }

    function sanitizeSnapshot(snapshot) {
        const input = snapshot && typeof snapshot === 'object' ? snapshot : {};
        const inputFiles = input.files && typeof input.files === 'object' ? Object.entries(input.files) : [];
        const eligibleFiles = inputFiles.filter(([rawPath]) => shouldIncludePath(rawPath));
        if (eligibleFiles.length > SNAPSHOT_LIMITS.maxFiles) {
            throw new Error(`Titan Zero snapshot has too many analyzed files (maximum ${SNAPSHOT_LIMITS.maxFiles}; ignored/generated files do not count)`);
        }
        const files = Object.create(null);
        let totalChars = 0;
        for (const [rawPath, rawText] of eligibleFiles) {
            const path = normalizePath(rawPath);
            if (Object.prototype.hasOwnProperty.call(files, path)) {
                throw new Error(`Titan Zero snapshot contains duplicate canonical path: ${path}`);
            }
            const text = typeof rawText === 'string' ? rawText : String(rawText ?? '');
            if (text.length > SNAPSHOT_LIMITS.maxFileChars) {
                throw new Error(`Titan Zero snapshot file exceeds limit: ${path}`);
            }
            totalChars += text.length;
            if (totalChars > SNAPSHOT_LIMITS.maxTotalChars) {
                throw new Error(`Titan Zero snapshot exceeds total content limit (${SNAPSHOT_LIMITS.maxTotalChars} characters)`);
            }
            files[path] = redactSourceText(text);
        }
        const rawSql = String(input.sqlText || '');
        if (rawSql.length > SNAPSHOT_LIMITS.maxSqlChars) {
            throw new Error(`Titan Zero SQL snapshot exceeds limit (${SNAPSHOT_LIMITS.maxSqlChars} characters)`);
        }
        return {
            files,
            filePaths: Object.keys(files),
            sqlText: extractDdlOnly(rawSql),
            navigation: sanitizeNavigation(input.navigation),
            permissions: sanitizePermissions(input.permissions)
        };
    }

    function register(settings) {
        if (!global.CodeeCapabilityRegistry) throw new Error('Codee capability registry is unavailable');
        if (!global.CodeeTitanZeroReceiverAdapter) throw new Error('Titan Zero receiver adapter is unavailable');
        const effective = normalizeSettings(settings);
        const registration = global.CodeeTitanZeroReceiverAdapter.register(global.CodeeCapabilityRegistry, { settings: effective });

        // Replace the donor adapter's direct providers with canonical Codee providers that
        // always apply host snapshot sanitization and locked settings before analysis.
        const safeProvider = (id, surface) => global.CodeeCapabilityRegistry.registerContextProvider({
            id,
            surface,
            priority: 50,
            provide(snapshot, options) {
                return analyze(snapshot, effective, options).context;
            }
        });
        safeProvider('titan-zero-runner-context', 'runner');
        safeProvider('titan-zero-plan-preflight', 'multi_step_plans');
        return registration;
    }

    function sanitizeSelectedContext(selected) {
        const value = selected && typeof selected === 'object' ? selected : {};
        return {
            // Persist only structural selection evidence. Route IDs/labels/URIs and arbitrary
            // graph metadata can contain source literals, so they stay in the ephemeral analyzer
            // graph and are never copied into Codee's persisted/returned selected context.
            nodes: (Array.isArray(value.nodes) ? value.nodes : []).slice(0, 24).map(node => ({
                type: String(node?.type || '').slice(0, 80) || null,
                path: node?.path && shouldIncludePath(node.path) ? normalizePath(node.path) : null
            })),
            edges: (Array.isArray(value.edges) ? value.edges : []).slice(0, 50).map(edge => ({
                kind: String(edge?.kind || '').slice(0, 80) || null
            })),
            bounded: true
        };
    }

    function buildSafeSummary(report, selected, impact, testMatrix) {
        const runtime = report?.runtimeDiagnostics || {};
        return {
            capabilityId: CAPABILITY_ID,
            analyzedAt: new Date().toISOString(),
            project: {
                recognized: Boolean(report?.project?.recognized),
                confidence: Number(report?.project?.confidence || 0),
                stack: report?.project?.stack || {}
            },
            schema: {
                tables: Number(report?.schemaGraph?.stats?.analyzedTables || 0),
                ignoredTables: Number(report?.schemaGraph?.stats?.ignoredTables || 0),
                columns: Number(report?.schemaGraph?.stats?.columns || 0),
                indexes: Number(report?.schemaGraph?.stats?.indexes || 0),
                foreignKeys: Number(report?.schemaGraph?.stats?.foreignKeys || 0),
                sensitiveColumnNames: Number(report?.schemaGraph?.sensitiveColumns?.length || 0)
            },
            migrations: {
                filesAnalyzed: Number(report?.migrations?.filesAnalyzed || 0),
                findings: Number(report?.migrations?.risks?.length || 0),
                highestSeverity: report?.migrations?.highestSeverity || 'none'
            },
            tenancy: {
                mixedBoundary: Boolean(report?.tenancy?.mixedBoundary),
                tenantCompanyTables: Number(report?.tenancy?.boundaries?.tenant_company?.tables?.length || 0),
                companyTables: Number(report?.tenancy?.boundaries?.company?.tables?.length || 0),
                userTables: Number(report?.tenancy?.boundaries?.user?.tables?.length || 0)
            },
            routes: {
                declarations: Number(report?.routes?.totalRouteCalls || 0),
                named: Number(report?.routes?.namedRoutes || 0),
                collisions: Array.isArray(report?.routes?.duplicateNames) ? report.routes.duplicateNames.length : 0
            },
            frontend: {
                bladeFiles: Number(report?.frontend?.bladeFiles || 0),
                livewireComponents: Number(report?.frontend?.livewire?.components?.length || 0),
                reactFiles: Number(report?.frontend?.reactFiles?.length || 0),
                alpineFiles: Number(report?.frontend?.alpineFiles?.length || 0),
                themeFamilies: Number(report?.frontend?.themeFamilies?.length || 0)
            },
            config: { sensitiveEnvNames: Number(report?.config?.sensitiveEnvKeys?.length || 0) },
            riskCodes: (report?.risks || []).map(item => item.code).filter(Boolean),
            runtimeDiagnostics: runtime,
            selectedContext: sanitizeSelectedContext(selected),
            impact: impact || { domains: [], riskLevel: 'low', recommendations: [] },
            testMatrix: testMatrix || { commands: [], requiredCount: 0 },
            context: String(report?.context || '')
        };
    }

    function sanitizeSchemaGraph(schemaGraph) {
        const graph = schemaGraph || {};
        return {
            parsed: Boolean(graph.parsed),
            totalTablesInDump: Number(graph.totalTablesInDump || 0),
            tables: (graph.tables || []).map(table => ({
                name: table.name,
                columns: (table.columns || []).map(column => ({
                    name: column.name,
                    type: column.type,
                    nullable: Boolean(column.nullable),
                    sensitive: Boolean(column.sensitive),
                    tenancyRole: column.tenancyRole || null,
                    jsonLike: Boolean(column.jsonLike)
                })),
                tenancy: Array.isArray(table.tenancy) ? table.tenancy.slice() : [],
                jsonColumns: Array.isArray(table.jsonColumns) ? table.jsonColumns.slice() : []
            })),
            indexes: (graph.indexes || []).map(index => ({ table: index.table, name: index.name, unique: Boolean(index.unique), primary: Boolean(index.primary), columns: (index.columns || []).slice() })),
            foreignKeys: (graph.foreignKeys || []).map(key => ({ table: key.table, name: key.name, columns: (key.columns || []).slice(), referencesTable: key.referencesTable, referencesColumns: (key.referencesColumns || []).slice() })),
            relations: (graph.relations || []).map(relation => ({ from: relation.from, to: relation.to, via: relation.via, name: relation.name })),
            sensitiveColumns: (graph.sensitiveColumns || []).map(item => ({ table: item.table, column: item.column })),
            ignoredTables: (graph.ignoredTables || []).slice(),
            ignoredPrefixes: (graph.ignoredPrefixes || []).slice(),
            stats: { ...(graph.stats || {}) }
        };
    }

    function sanitizeRoutes(routes) {
        const report = routes || {};
        const safeRoute = route => ({
            path: route.path || null,
            method: route.method || null,
            uri: route.uri || null,
            name: route.name || null,
            controller: route.controller || null,
            action: route.action || null,
            middleware: Array.isArray(route.middleware) ? route.middleware.slice() : []
        });
        return {
            totalRouteCalls: Number(report.totalRouteCalls || 0),
            namedRoutes: Number(report.namedRoutes || 0),
            duplicateNames: (report.duplicateNames || []).map(item => ({ name: item.name, first: item.first, second: item.second })),
            routes: (report.routes || []).map(safeRoute),
            controllerRoutes: (report.controllerRoutes || []).map(safeRoute),
            middlewareNames: (report.middlewareNames || []).slice()
        };
    }

    function sanitizeMigrations(migrations) {
        const report = migrations || {};
        const sanitizeRisk = risk => ({ path: risk.path, code: risk.code, severity: risk.severity, message: risk.message });
        return {
            filesAnalyzed: Number(report.filesAnalyzed || 0),
            files: (report.files || []).map(file => ({ path: file.path, operations: (file.operations || []).map(op => ({ operation: op.operation, table: op.table })), targets: (file.targets || []).slice(), risks: (file.risks || []).map(sanitizeRisk) })),
            risks: (report.risks || []).map(sanitizeRisk),
            highestSeverity: report.highestSeverity || 'none'
        };
    }

    function sanitizeProjectGraph(projectGraph) {
        const graph = projectGraph && typeof projectGraph === 'object' ? projectGraph : {};
        const nodes = Array.isArray(graph.nodes) ? graph.nodes.slice(0, 5000) : [];
        const idMap = new Map();
        const safeNodes = nodes.map((node, index) => {
            const safeId = `node-${index + 1}`;
            if (node && node.id !== undefined && node.id !== null) idMap.set(String(node.id), safeId);
            const rawPath = node?.path;
            return {
                id: safeId,
                type: String(node?.type || '').slice(0, 80) || null,
                path: rawPath && shouldIncludePath(rawPath) ? normalizePath(rawPath) : null
            };
        });
        const safeEdges = (Array.isArray(graph.edges) ? graph.edges : []).slice(0, 20000).map(edge => ({
            from: idMap.get(String(edge?.from ?? '')) || null,
            to: idMap.get(String(edge?.to ?? '')) || null,
            kind: String(edge?.kind || '').slice(0, 80) || null
        })).filter(edge => edge.from || edge.to || edge.kind);
        return { nodes: safeNodes, edges: safeEdges, bounded: true };
    }

    function buildSafeReport(report) {
        if (!report || typeof report !== 'object') return null;
        return {
            project: report.project || {},
            schemaGraph: sanitizeSchemaGraph(report.schemaGraph),
            migrations: sanitizeMigrations(report.migrations),
            tenancy: report.tenancy || {},
            architecture: report.architecture || {},
            routes: sanitizeRoutes(report.routes),
            frontend: report.frontend || {},
            themes: report.themes || {},
            navigation: report.navigation || {},
            modelSchema: report.modelSchema || {},
            routeConsumers: report.routeConsumers || {},
            versions: report.versions || {},
            config: report.config || {},
            projectGraph: sanitizeProjectGraph(report.projectGraph),
            risks: report.risks || [],
            runtimeDiagnostics: report.runtimeDiagnostics || {},
            errorClassification: report.errorClassification || null,
            context: String(report.context || ''),
            settings: normalizeSettings(report.settings || {})
        };
    }

    function analyze(snapshot, settings, options) {
        const effective = normalizeSettings(settings);
        if (!effective.enabled) {
            return { enabled: false, context: '', report: null, safeSummary: null, impact: { domains: [], riskLevel: 'low', recommendations: [] }, testMatrix: { commands: [], requiredCount: 0 }, selected: { nodes: [], edges: [] } };
        }
        if (!global.CodeeTitanZeroDeveloperPack) throw new Error('Titan Zero developer pack is unavailable');
        const safeSnapshot = sanitizeSnapshot(snapshot);
        const rawReport = global.CodeeTitanZeroDeveloperPack.analyzeSnapshot(safeSnapshot, effective);
        const applicable = effective.autoDetect === false || Boolean(rawReport?.project?.recognized);
        const boundedTask = String(options?.task || '').slice(0, SNAPSHOT_LIMITS.maxTaskChars);
        const selected = applicable && global.CodeeTitanZeroContextSelector?.select
            ? global.CodeeTitanZeroContextSelector.select(rawReport.projectGraph, boundedTask, { maxNodes: 24, maxEdges: 50 })
            : { nodes: [], edges: [] };
        const changedPaths = applicable ? Array.from(new Set((Array.isArray(options?.changedPaths) ? options.changedPaths : [])
            .slice(0, SNAPSHOT_LIMITS.maxChangedPaths)
            .filter(path => shouldIncludePath(path))
            .map(normalizePath))) : [];
        const impact = applicable && global.CodeeTitanZeroImpactEngine?.analyze
            ? global.CodeeTitanZeroImpactEngine.analyze({ changedPaths, report: rawReport })
            : { domains: [], riskLevel: 'low', recommendations: [] };
        const testMatrix = applicable && global.CodeeTitanZeroTestMatrix?.build
            ? global.CodeeTitanZeroTestMatrix.build(impact, { files: safeSnapshot.files })
            : { commands: [], requiredCount: 0 };
        const errorClassification = options?.error && global.CodeeTitanZeroErrorClassifier?.classify
            ? global.CodeeTitanZeroErrorClassifier.classify(redactSourceText(String(options.error).slice(0, 8000)))
            : null;
        const reportSource = applicable ? { ...rawReport, errorClassification } : { ...rawReport, context: '', errorClassification };
        const report = buildSafeReport(reportSource);
        const safeSelected = sanitizeSelectedContext(selected);
        return {
            enabled: true,
            applicable,
            context: applicable ? String(rawReport.context || '') : '',
            report,
            selected: safeSelected,
            impact,
            testMatrix,
            safeSummary: buildSafeSummary(reportSource, safeSelected, impact, testMatrix)
        };
    }

    function registryPayload() {
        const descriptor = global.CodeeTitanZeroDeveloperPack?.registrationDescriptor?.() || null;
        const registry = global.CodeeCapabilityRegistry?.snapshot?.() || { prompts: [], skills: [], profiles: [], contextProviders: [], diagnosticsSections: [], settingsSections: [] };
        const ids = rows => new Set((Array.isArray(rows) ? rows : []).map(item => String(item?.id || '')).filter(Boolean));
        const promptIds = ids(descriptor?.prompts);
        const skillIds = ids(descriptor?.skills);
        const profileIds = ids(descriptor?.profiles);
        const contextIds = new Set([...ids(descriptor?.contextProviders), 'titan-zero-runner-context', 'titan-zero-plan-preflight']);
        // The host integration intentionally replaces the donor's two direct providers
        // with sanitized providers using the same stable ids. Filter by those ids rather
        // than exposing every other installed capability pack in Titan's own status.
        return {
            pack: descriptor ? {
                id: descriptor.id,
                version: descriptor.version,
                title: descriptor.title,
                type: descriptor.type,
                placements: descriptor.placements,
                analyzers: descriptor.analyzers,
                authority: descriptor.authority
            } : null,
            prompts: registry.prompts.filter(item => promptIds.has(String(item?.id || ''))),
            skills: registry.skills.filter(item => skillIds.has(String(item?.id || ''))),
            profiles: registry.profiles.filter(item => profileIds.has(String(item?.id || ''))),
            commands: (descriptor?.commands || []).map(item => ({ ...item })),
            contextProviders: registry.contextProviders.filter(item => contextIds.has(String(item?.id || ''))),
            diagnosticsSections: registry.diagnosticsSections.filter(item => String(item?.id || '').startsWith('titan-zero')),
            settingsSections: registry.settingsSections.filter(item => String(item?.id || '').startsWith('titan-zero'))
        };
    }

    global.CodeeTitanZeroHostIntegration = Object.freeze({
        CAPABILITY_ID,
        DEFAULTS,
        SNAPSHOT_LIMITS,
        normalizeSettings,
        normalizePath,
        hasUnsafePathSegments,
        shouldIgnorePath,
        shouldIncludePath,
        splitSqlStatements,
        extractDdlOnly,
        sanitizeSnapshot,
        redactSourceText,
        sanitizeSchemaGraph,
        sanitizeProjectGraph,
        buildSafeReport,
        register,
        analyze,
        registryPayload,
        buildSafeSummary,
        sanitizeSelectedContext
    });
})(typeof globalThis !== 'undefined' ? globalThis : this);
