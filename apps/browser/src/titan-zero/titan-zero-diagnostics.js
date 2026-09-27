(function attachTitanZeroDiagnostics(global) {
    'use strict';

    function check(id, label, status, detail, severity) {
        return { id, label, status, detail, severity: severity || (status === 'pass' ? 'info' : 'warning') };
    }

    function build(report) {
        const project = report?.project || {};
        const schema = report?.schema || {};
        const routes = report?.routes || {};
        const themes = report?.themes || {};
        const checks = [];

        checks.push(check(
            'project-recognition',
            'Titan Zero project recognition',
            project.recognized ? 'pass' : 'warn',
            project.recognized ? `Recognized with ${Math.round((project.confidence || 0) * 100)}% confidence.` : 'Titan Zero markers are incomplete.'
        ));
        checks.push(check(
            'extensions-included',
            'Extension internals included',
            'pass',
            'app/Extensions/** is first-class Titan Zero repository evidence; only unsafe/generated/donor source trees are excluded.'
        ));
        checks.push(check(
            'schema-available',
            'Database schema parsed',
            schema.parsed ? 'pass' : 'warn',
            schema.parsed ? `${schema.analyzedCoreTables} tables analyzed; ${schema.ignoredTables} tables ignored by explicit policy.` : 'No CREATE TABLE statements were supplied.'
        ));
        checks.push(check(
            'tenancy-clarity',
            'Tenancy signals',
            schema.tenancy?.mixedCompanyBoundary ? 'warn' : 'pass',
            schema.tenancy?.mixedCompanyBoundary
                ? 'Both tenant_company_id and company_id exist in analyzed core schema. Require ownership analysis before edits.'
                : 'No mixed company-boundary signal detected in analyzed schema.'
        ));
        checks.push(check(
            'sensitive-schema',
            'Sensitive schema awareness',
            'pass',
            `${schema.sensitiveColumnCount || 0} sensitive column names detected. Values are never extracted by this pack.`
        ));
        checks.push(check(
            'route-collisions',
            'Route-name collisions',
            routes.duplicateNames?.length ? 'warn' : 'pass',
            routes.duplicateNames?.length ? `${routes.duplicateNames.length} duplicate named-route declarations detected.` : 'No duplicate named-route declarations detected in supplied route files.'
        ));
        checks.push(check(
            'theme-surface',
            'Theme/view surface',
            themes.themeCount ? 'pass' : 'warn',
            themes.themeCount ? `${themes.themeCount} view families detected.` : 'No theme/view families detected.'
        ));

        return {
            id: 'titan-zero-core',
            title: 'Titan Zero Core',
            summary: checks.every(item => item.status === 'pass') ? 'green' : 'attention',
            checks
        };
    }

    global.CodeeTitanZeroDiagnostics = Object.freeze({ build });
})(typeof globalThis !== 'undefined' ? globalThis : this);
