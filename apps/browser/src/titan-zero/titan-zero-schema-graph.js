(function attachTitanZeroSchemaGraph(global) {
    'use strict';

    const SENSITIVE = /(password|passwd|secret|token|api[_-]?key|private[_-]?key|access[_-]?key|refresh[_-]?token|credential|client[_-]?secret|webhook[_-]?secret)/i;
    const MAX_TABLES = 10000;
    const MAX_DEFINITIONS_PER_TABLE = 5000;
    const MAX_INDEXES = 20000;
    const MAX_FOREIGN_KEYS = 20000;
    const MAX_SENSITIVE_COLUMNS = 20000;
    const MAX_INDEX_COLUMNS = 500;

    function splitDefinitions(body, limit = MAX_DEFINITIONS_PER_TABLE) {
        const lines = [];
        let current = '', depth = 0, quote = null;
        const max = Math.max(0, Number(limit) || 0);
        for (const ch of String(body || '')) {
            if (quote) { current += ch; if (ch === quote) quote = null; continue; }
            if (ch === "'" || ch === '"' || ch === '`') { quote = ch; current += ch; continue; }
            if (ch === '(') depth += 1;
            if (ch === ')' && depth > 0) depth -= 1;
            if (ch === ',' && depth === 0) {
                if (current.trim()) { if (lines.length >= max) break; lines.push(current.trim()); }
                current = ''; continue;
            }
            current += ch;
        }
        if (lines.length < max && current.trim()) lines.push(current.trim());
        return lines;
    }

    function parseColumn(definition) {
        const match = String(definition || '').match(/^`([^`]+)`\s+(.+)$/s);
        if (!match) return null;
        const name = match[1], rest = match[2].trim();
        const typeMatch = rest.match(/^([a-zA-Z]+(?:\([^)]*\))?(?:\s+unsigned)?)/i);
        return { name, type: typeMatch ? typeMatch[1].replace(/\s+/g, ' ') : rest.split(/\s+/)[0], nullable: /\bNULL\b/i.test(rest) && !/\bNOT\s+NULL\b/i.test(rest), defaultExpression: (rest.match(/\bDEFAULT\s+([^\s,]+)/i) || [])[1] || null, sensitive: SENSITIVE.test(name), tenancyRole: name === 'tenant_company_id' ? 'tenant_company' : name === 'company_id' ? 'company' : name === 'user_id' ? 'user' : null, jsonLike: /\bjson\b/i.test(rest), definition: rest };
    }

    function parseColumnsList(text) {
        return String(text || '').split(',').slice(0, MAX_INDEX_COLUMNS).map(item => { const match = item.trim().match(/`([^`]+)`/); return match ? match[1] : item.trim().replace(/[()`]/g, ''); }).filter(Boolean);
    }
    function parseIndex(table, definition) {
        const text = String(definition || ''); let match = text.match(/^PRIMARY\s+KEY\s*\((.+)\)$/i);
        if (match) return { table, name: 'PRIMARY', unique: true, primary: true, columns: parseColumnsList(match[1]) };
        match = text.match(/^(?:UNIQUE\s+)?KEY\s+`([^`]+)`\s*\((.+)\)$/i); if (!match) return null;
        return { table, name: match[1], unique: /^UNIQUE/i.test(text), primary: false, columns: parseColumnsList(match[2]) };
    }
    function parseForeignKey(table, definition) {
        const match = String(definition || '').match(/^(?:CONSTRAINT\s+`([^`]+)`\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+`([^`]+)`\s*\(([^)]+)\)/i); if (!match) return null;
        return { table, name: match[1] || `${table}_${parseColumnsList(match[2]).join('_')}_fk`, columns: parseColumnsList(match[2]), referencesTable: match[3], referencesColumns: parseColumnsList(match[4]) };
    }
    function createTableBlocks(sqlText, limit = MAX_TABLES) {
        const blocks = [], pattern = /CREATE\s+TABLE\s+`([^`]+)`\s*\((.*?)\)\s*(?:ENGINE=|;)/gsi; let match; const max = Math.max(0, Number(limit) || 0);
        while (blocks.length < max && (match = pattern.exec(String(sqlText || '')))) blocks.push({ name: match[1], body: match[2] });
        return blocks;
    }
    function isIgnored(name, prefixes) { const lower = String(name || '').toLowerCase(); return (prefixes || []).some(prefix => lower.startsWith(String(prefix || '').toLowerCase())); }

    function build(sqlText, options) {
        const profile = options?.profile || global.CodeeTitanZeroCoreProfile || {}, ignoredPrefixes = options?.ignoredTablePrefixes || profile.ignoredTablePrefixes || [];
        const probed = createTableBlocks(sqlText, MAX_TABLES + 1); let truncated = probed.length > MAX_TABLES; const blocks = probed.slice(0, MAX_TABLES);
        const tables = [], indexes = [], foreignKeys = [], sensitiveColumns = [], ignoredTables = [];
        for (const block of blocks) {
            if (isIgnored(block.name, ignoredPrefixes)) { ignoredTables.push(block.name); continue; }
            const probeDefinitions = splitDefinitions(block.body, MAX_DEFINITIONS_PER_TABLE + 1); if (probeDefinitions.length > MAX_DEFINITIONS_PER_TABLE) truncated = true;
            const columns = [];
            for (const definition of probeDefinitions.slice(0, MAX_DEFINITIONS_PER_TABLE)) {
                const column = parseColumn(definition);
                if (column) { columns.push(column); if (column.sensitive) { if (sensitiveColumns.length < MAX_SENSITIVE_COLUMNS) sensitiveColumns.push({ table: block.name, column: column.name }); else truncated = true; } continue; }
                const index = parseIndex(block.name, definition); if (index) { if (indexes.length < MAX_INDEXES) indexes.push(index); else truncated = true; }
                const foreignKey = parseForeignKey(block.name, definition); if (foreignKey) { if (foreignKeys.length < MAX_FOREIGN_KEYS) foreignKeys.push(foreignKey); else truncated = true; }
            }
            tables.push({ name: block.name, columns, tenancy: columns.filter(column => column.tenancyRole).map(column => column.tenancyRole), jsonColumns: columns.filter(column => column.jsonLike).map(column => column.name) });
        }
        const tableMap = Object.create(null); for (const table of tables) tableMap[table.name] = table;
        const relations = foreignKeys.map(key => ({ from: key.table, to: key.referencesTable, via: key.columns.join(','), name: key.name }));
        return { parsed: blocks.length > 0, totalTablesInDump: blocks.length, tables, tableMap, indexes, foreignKeys, relations, sensitiveColumns, ignoredTables, ignoredPrefixes: ignoredPrefixes.slice(), truncated, stats: { analyzedTables: tables.length, ignoredTables: ignoredTables.length, columns: tables.reduce((sum, table) => sum + table.columns.length, 0), indexes: indexes.length, foreignKeys: foreignKeys.length, jsonColumns: tables.reduce((sum, table) => sum + table.jsonColumns.length, 0) } };
    }

    global.CodeeTitanZeroSchemaGraph = Object.freeze({ build, splitDefinitions, parseColumn, parseIndex, parseForeignKey, createTableBlocks, MAX_TABLES, MAX_DEFINITIONS_PER_TABLE, MAX_INDEXES, MAX_FOREIGN_KEYS });
})(typeof globalThis !== 'undefined' ? globalThis : this);
