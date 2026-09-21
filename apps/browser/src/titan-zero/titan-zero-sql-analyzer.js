(function attachTitanZeroSqlAnalyzer(global) {
    'use strict';

    const SENSITIVE_COLUMN_PATTERN = /(password|passwd|secret|token|api[_-]?key|private[_-]?key|access[_-]?key|refresh[_-]?token|credential|client[_-]?secret|webhook[_-]?secret)/i;
    const MAX_TABLES = 10000;
    const MAX_COLUMNS_PER_TABLE = 5000;
    const MAX_SENSITIVE_COLUMNS = 20000;
    const MAX_TENANCY_TABLES = 10000;

    function normalizePrefix(prefix) { return String(prefix || '').toLowerCase(); }
    function parseColumns(body, limit = MAX_COLUMNS_PER_TABLE) {
        const columns = []; const lines = String(body || '').split(/\r?\n/); const max = Math.max(0, Number(limit) || 0);
        for (const line of lines) {
            if (columns.length >= max) break;
            const match = line.trim().match(/^`([^`]+)`\s+([^,]+?)(?:,)?$/); if (!match) continue;
            const name = match[1], definition = match[2].trim();
            columns.push({ name, definition, sensitive: SENSITIVE_COLUMN_PATTERN.test(name), tenantRole: name === 'tenant_company_id' ? 'tenant_company' : name === 'company_id' ? 'company' : name === 'user_id' ? 'user' : null, jsonLike: /\bjson\b/i.test(definition) });
        }
        return columns;
    }
    function parseCreateTables(sqlText, limit = MAX_TABLES) {
        const sql = String(sqlText || ''), tables = [], pattern = /CREATE\s+TABLE\s+`([^`]+)`\s*\((.*?)\)\s*(?:ENGINE=|;)/gsi; let match; const max = Math.max(0, Number(limit) || 0);
        while (tables.length < max && (match = pattern.exec(sql))) tables.push({ name: match[1], body: match[2], columns: parseColumns(match[2]) });
        return tables;
    }
    function isIgnoredTable(name, ignoredPrefixes) { const lower = String(name || '').toLowerCase(); return (ignoredPrefixes || []).some(prefix => lower.startsWith(normalizePrefix(prefix))); }
    function prefixOf(name) { const value = String(name || ''), index = value.indexOf('_'); return index > 0 ? value.slice(0, index) : '(none)'; }

    function analyze(sqlText, options) {
        const profile = options?.profile || global.CodeeTitanZeroCoreProfile || {}, ignoredPrefixes = options?.ignoredTablePrefixes || profile.ignoredTablePrefixes || [];
        const probed = parseCreateTables(sqlText, MAX_TABLES + 1); let truncated = probed.length > MAX_TABLES; const allTables = probed.slice(0, MAX_TABLES);
        for (const table of allTables) {
            const probe = parseColumns(table.body, MAX_COLUMNS_PER_TABLE + 1);
            if (probe.length > MAX_COLUMNS_PER_TABLE) truncated = true;
            table.columns = probe.slice(0, MAX_COLUMNS_PER_TABLE); delete table.body;
        }
        const tables = allTables.filter(table => !isIgnoredTable(table.name, ignoredPrefixes)), ignoredTables = allTables.filter(table => isIgnoredTable(table.name, ignoredPrefixes));
        const prefixCounts = Object.create(null), sensitiveColumns = [], tenancy = { tenantCompany: [], company: [], user: [] }; let jsonColumnCount = 0;
        for (const table of tables) {
            const prefix = prefixOf(table.name); prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1;
            for (const column of table.columns) {
                if (column.sensitive) { if (sensitiveColumns.length < MAX_SENSITIVE_COLUMNS) sensitiveColumns.push({ table: table.name, column: column.name }); else truncated = true; }
                if (column.jsonLike) jsonColumnCount += 1;
                if (column.tenantRole === 'tenant_company') { if (tenancy.tenantCompany.length < MAX_TENANCY_TABLES) tenancy.tenantCompany.push(table.name); else truncated = true; }
                if (column.tenantRole === 'company') { if (tenancy.company.length < MAX_TENANCY_TABLES) tenancy.company.push(table.name); else truncated = true; }
                if (column.tenantRole === 'user') { if (tenancy.user.length < MAX_TENANCY_TABLES) tenancy.user.push(table.name); else truncated = true; }
            }
        }
        return { parsed: allTables.length > 0, totalTablesInDump: allTables.length, analyzedCoreTables: tables.length, ignoredTables: ignoredTables.length, ignoredPrefixes: ignoredPrefixes.slice(), prefixCounts, sensitiveColumnCount: sensitiveColumns.length, sensitiveColumns, jsonColumnCount, tenancy: { tenantCompanyTableCount: tenancy.tenantCompany.length, companyTableCount: tenancy.company.length, userTableCount: tenancy.user.length, tenantCompanyTables: tenancy.tenantCompany, companyTables: tenancy.company, userTables: tenancy.user, mixedCompanyBoundary: tenancy.tenantCompany.length > 0 && tenancy.company.length > 0 }, tables, truncated };
    }
    function schemaSummary(analysis, maxTables) { const limit = Math.max(1, Math.min(Number(maxTables || 60), 1000)); return (analysis?.tables || []).slice(0, limit).map(table => ({ name: table.name, columns: table.columns.slice(0, MAX_COLUMNS_PER_TABLE).map(column => column.name), tenancy: table.columns.filter(column => column.tenantRole).slice(0, MAX_COLUMNS_PER_TABLE).map(column => column.name), sensitiveColumns: table.columns.filter(column => column.sensitive).slice(0, MAX_COLUMNS_PER_TABLE).map(column => column.name) })); }

    global.CodeeTitanZeroSqlAnalyzer = Object.freeze({ analyze, parseCreateTables, parseColumns, schemaSummary, isIgnoredTable, MAX_TABLES, MAX_COLUMNS_PER_TABLE });
})(typeof globalThis !== 'undefined' ? globalThis : this);
