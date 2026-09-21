(function attachTitanZeroContext(global) {
    'use strict';

    function line(label, value) {
        return value === undefined || value === null || value === '' ? null : `- ${label}: ${value}`;
    }

    function formatPrefixCounts(prefixCounts) {
        return Object.entries(prefixCounts || {})
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .slice(0, 12)
            .map(([prefix, count]) => `${prefix}=${count}`)
            .join(', ');
    }

    function build(report, options) {
        const maxChars = Math.max(1000, Number(options?.maxChars || 12000));
        const detection = report?.project || {};
        const schema = report?.schema || {};
        const routes = report?.routes || {};
        const themes = report?.themes || {};
        const stack = detection.stack || {};

        const lines = [
            '# Titan Zero Core Project Context',
            '',
            'Use this as project evidence. Extension internals may be used when present in the sanitized snapshot; preserve their explicit ownership boundaries.',
            '',
            '## Project',
            line('Recognized', detection.recognized ? 'yes' : 'no'),
            line('Confidence', Number(detection.confidence || 0).toFixed(2)),
            line('Core files scanned', detection.scannedFileCount),
            line('Ignored unsafe/generated source files', detection.ignoredFileCount),
            '',
            '## Stack',
            line('PHP', stack.php),
            line('Laravel', stack.laravel),
            line('Livewire', stack.livewire),
            line('React', stack.react),
            line('Vite', stack.vite),
            line('Tailwind', stack.tailwind),
            '',
            '## Database schema',
            line('Tables in supplied dump', schema.totalTablesInDump),
            line('Tables analyzed', schema.analyzedCoreTables),
            line('Ignored tables', schema.ignoredTables),
            line('Table prefixes', formatPrefixCounts(schema.prefixCounts)),
            line('Sensitive column names found', schema.sensitiveColumnCount),
            line('JSON columns', schema.jsonColumnCount),
            line('tenant_company_id tables', schema.tenancy?.tenantCompanyTableCount),
            line('company_id tables', schema.tenancy?.companyTableCount),
            line('user_id tables', schema.tenancy?.userTableCount),
            line('Mixed company tenancy signals', schema.tenancy?.mixedCompanyBoundary ? 'yes — inspect ownership before edits' : 'no'),
            '',
            '## Routes',
            line('Route declarations', routes.totalRouteCalls),
            line('Named routes', routes.namedRoutes),
            line('Duplicate route names detected', routes.duplicateNames?.length || 0),
            '',
            '## Themes / UI',
            line('View families detected', themes.themeCount),
            line('Largest view families', (themes.themes || []).slice(0, 8).map(t => `${t.name}(${t.viewFiles})`).join(', ')),
            '',
            '## Safety rules',
            '- Include app/Extensions/** as first-class repository evidence while preserving extension ownership boundaries.',
            '- Treat SQL values as sensitive; analyze DDL/schema only.',
            '- Determine ownership/tenancy before changing queries or migrations.',
            '- Preserve existing Runner/Plan authority; this pack provides context only.',
            '- Run impact analysis before editing routes, schema, themes, controllers, or services.'
        ].filter(value => value !== null);

        const text = lines.join('\n');
        return text.length <= maxChars ? text : `${text.slice(0, maxChars - 40)}\n\n[context truncated by configured limit]`;
    }

    global.CodeeTitanZeroContext = Object.freeze({ build });
})(typeof globalThis !== 'undefined' ? globalThis : this);
