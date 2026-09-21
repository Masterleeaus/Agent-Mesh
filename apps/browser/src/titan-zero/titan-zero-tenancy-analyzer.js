(function attachTitanZeroTenancyAnalyzer(global) {
    'use strict';

    const ROLES = Object.freeze([
        { id: 'tenant_company', column: 'tenant_company_id' },
        { id: 'company', column: 'company_id' },
        { id: 'user', column: 'user_id' }
    ]);

    function boundaryTables(schemaGraph, role) {
        return (schemaGraph?.tables || []).filter(table => table.columns.some(column => column.name === role.column)).map(table => table.name);
    }

    function analyzeFile(path, source) {
        const text = String(source || '');
        const signals = [];
        for (const role of ROLES) {
            const occurrences = (text.match(new RegExp(`\\b${role.column}\\b`, 'g')) || []).length;
            if (!occurrences) continue;
            const filtered = new RegExp(`(?:where|whereIn|whereBelongsTo|scope)[^;\\n]{0,180}${role.column}`, 'i').test(text);
            signals.push({ role: role.id, column: role.column, occurrences, queryConstraintSignal: filtered });
        }
        if (!signals.length) return null;
        return {
            path,
            kind: /\/Models\//.test(path) ? 'model' : /\/Controllers\//.test(path) ? 'controller' : /\/Jobs\//.test(path) ? 'job' : /\/Services\//.test(path) ? 'service' : 'php',
            signals
        };
    }

    function analyze(schemaGraph, files) {
        const boundaries = {};
        for (const role of ROLES) boundaries[role.id] = { column: role.column, tables: boundaryTables(schemaGraph, role) };
        const fileSignals = [];
        for (const [path, source] of Object.entries(files || {})) {
            if (global.CodeeTitanZeroSnapshotPolicy?.shouldIgnore?.(path) || !/\.php$/i.test(path)) continue;
            const result = analyzeFile(path, source);
            if (result) fileSignals.push(result);
        }
        const mixedBoundary = boundaries.tenant_company.tables.length > 0 && boundaries.company.tables.length > 0;
        const unconstrainedSignals = fileSignals.flatMap(file => file.signals.filter(signal => !signal.queryConstraintSignal).map(signal => ({ path: file.path, role: signal.role, column: signal.column })));
        return {
            boundaries,
            mixedBoundary,
            files: fileSignals,
            unconstrainedSignals,
            policy: {
                globalColumnAssumptionAllowed: false,
                requirement: 'Resolve tenancy ownership from the target domain/table before editing queries, jobs, models, or migrations.'
            }
        };
    }

    global.CodeeTitanZeroTenancyAnalyzer = Object.freeze({ analyze, analyzeFile, ROLES });
})(typeof globalThis !== 'undefined' ? globalThis : this);
