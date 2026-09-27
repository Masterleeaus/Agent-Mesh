(function attachTitanZeroMigrationAnalyzer(global) {
    'use strict';

    function ignored(path) {
        return global.CodeeTitanZeroSnapshotPolicy?.shouldIgnore?.(path) || false;
    }
    function isMigrationPath(path) { return /^database\/migrations\/.*\.php$/i.test(path) || /^app\/Extensions\/[^/]+\/(?:database\/migrations|migrations)\/.*\.php$/i.test(path); }

    const MAX_OPERATIONS_PER_FILE = 2000;
    const MAX_RISKS_PER_FILE = 2000;
    const MAX_QUOTED_VALUES = 5000;
    function addRisk(risks, path, code, severity, message, evidence) {
        if (risks.length < MAX_RISKS_PER_FILE) risks.push({ path, code, severity, message, evidence: evidence || null });
    }

    function quotedArgs(text) {
        const values = [];
        const re = /['"]([^'"]+)['"]/g;
        let match;
        while (values.length < MAX_QUOTED_VALUES && (match = re.exec(text))) values.push(match[1]);
        return values;
    }

    function analyzeFile(path, source, schemaGraph) {
        const text = String(source || '');
        const risks = [];
        const operations = [];
        const targets = [];
        let match;
        const schemaRe = /Schema::(create|table|dropIfExists|drop|rename)\s*\(\s*['"]([^'"]+)['"]/g;
        while ((match = schemaRe.exec(text))) {
            if (operations.length < MAX_OPERATIONS_PER_FILE) operations.push({ operation: match[1], table: match[2] });
            if (targets.length < MAX_OPERATIONS_PER_FILE) targets.push(match[2]);
            if (match[1] === 'create' && schemaGraph?.tableMap?.[match[2]]) {
                addRisk(risks, path, 'TABLE_ALREADY_EXISTS_IN_SNAPSHOT', 'high', `Migration creates table ${match[2]} which already exists in supplied schema.`, match[0]);
            }
            if (match[1] === 'drop' || match[1] === 'dropIfExists' || match[1] === 'rename') {
                addRisk(risks, path, 'DESTRUCTIVE_SCHEMA_OPERATION', 'high', `Migration uses ${match[1]} on ${match[2]}.`, match[0]);
            }
        }

        const identifierRe = /(?:index|unique|primary|foreign|fullText|spatialIndex)\s*\([^;\n]*?['"]([^'"]{65,})['"]/g;
        while ((match = identifierRe.exec(text))) {
            addRisk(risks, path, 'MYSQL_IDENTIFIER_TOO_LONG', 'critical', `Explicit MySQL identifier is ${match[1].length} characters; MySQL identifiers are limited to 64.`, match[1]);
        }
        const genericStrings = quotedArgs(text).filter(value => value.length > 64 && /(index|unique|foreign|constraint|primary)/i.test(value));
        for (const value of genericStrings) {
            if (!risks.some(risk => risk.code === 'MYSQL_IDENTIFIER_TOO_LONG' && risk.evidence === value)) {
                addRisk(risks, path, 'MYSQL_IDENTIFIER_TOO_LONG', 'critical', `Likely schema identifier is ${value.length} characters.`, value);
            }
        }
        if (/['"]0000-00-00(?: 00:00:00)?['"]/i.test(text)) {
            addRisk(risks, path, 'INVALID_ZERO_TIMESTAMP_DEFAULT', 'critical', 'Zero-date timestamp default can fail under strict MySQL modes.');
        }
        if (/\bDB::(?:statement|unprepared|raw)\b/.test(text)) {
            addRisk(risks, path, 'RAW_SQL_MIGRATION', 'medium', 'Migration contains raw SQL and requires database-specific verification.');
        }
        if (/->(?:dropColumn|dropForeign|dropIndex|dropUnique|renameColumn)\s*\(/.test(text)) {
            addRisk(risks, path, 'DESTRUCTIVE_COLUMN_OR_INDEX_OPERATION', 'high', 'Migration removes or renames schema objects.');
        }
        if (/Schema::table/.test(text) && !/Schema::has(?:Table|Column)/.test(text)) {
            addRisk(risks, path, 'RESTARTABILITY_GUARD_ABSENT', 'low', 'Schema::table migration has no explicit hasTable/hasColumn guard; verify installer restartability expectations.');
        }
        return { path, operations, targets: Array.from(new Set(targets)), risks, truncated: operations.length >= MAX_OPERATIONS_PER_FILE || risks.length >= MAX_RISKS_PER_FILE }; 
    }

    function analyze(files, options) {
        const schemaGraph = options?.schemaGraph || null;
        const items = [];
        for (const [path, source] of Object.entries(files || {})) {
            if (ignored(path) || !isMigrationPath(path)) continue;
            items.push(analyzeFile(path, source, schemaGraph));
        }
        const risks = items.flatMap(item => item.risks);
        const rank = { critical: 4, high: 3, medium: 2, low: 1 };
        return {
            filesAnalyzed: items.length,
            files: items,
            risks: risks.sort((a, b) => (rank[b.severity] || 0) - (rank[a.severity] || 0) || a.path.localeCompare(b.path)),
            highestSeverity: risks.reduce((best, risk) => (rank[risk.severity] || 0) > (rank[best] || 0) ? risk.severity : best, 'none'),
            truncated: items.some(item => item.truncated)
        };
    }

    global.CodeeTitanZeroMigrationAnalyzer = Object.freeze({ analyze, analyzeFile, isMigrationPath, MAX_OPERATIONS_PER_FILE, MAX_RISKS_PER_FILE });
})(typeof globalThis !== 'undefined' ? globalThis : this);
