(function attachTitanZeroRuntimeDiagnostics(global) {
    'use strict';

    function check(id, label, status, detail, severity) {
        return { id, label, status, detail, severity: severity || (status === 'pass' ? 'info' : 'warning') };
    }
    function build(report) {
        const checks = [];
        checks.push(check('project', 'Titan Zero host recognition', report?.project?.recognized ? 'pass' : 'warn', report?.project?.recognized ? `Recognized at ${Math.round((report.project.confidence || 0) * 100)}% confidence.` : 'Host markers incomplete.'));
        const migrationRisks = report?.migrations?.risks || [];
        const criticalMigration = migrationRisks.filter(risk => risk.severity === 'critical');
        checks.push(check('migration-risk', 'Migration safety', criticalMigration.length ? 'fail' : migrationRisks.length ? 'warn' : 'pass', criticalMigration.length ? `${criticalMigration.length} critical migration risk(s) detected.` : `${migrationRisks.length} migration advisory finding(s).`, criticalMigration.length ? 'critical' : 'warning'));
        checks.push(check('tenancy', 'Tenancy boundary clarity', report?.tenancy?.mixedBoundary ? 'warn' : 'pass', report?.tenancy?.mixedBoundary ? 'Both tenant_company_id and company_id exist in core schema. Domain ownership must be resolved per change.' : 'No mixed company boundary detected in supplied core schema.'));
        const navigationIssues = (report?.navigation?.brokenParents?.length || 0)
            + (report?.navigation?.missingRoutes?.length || 0)
            + (report?.navigation?.missingPermissions?.length || 0)
            + (report?.navigation?.duplicateRoutes?.length || 0)
            + (report?.navigation?.duplicateIds?.length || 0)
            + (report?.navigation?.cycles?.length || 0);
        checks.push(check('navigation', 'Navigation metadata integrity', navigationIssues ? 'warn' : 'pass', `${report?.navigation?.brokenParents?.length || 0} broken parent(s), ${report?.navigation?.missingRoutes?.length || 0} missing route(s), ${report?.navigation?.missingPermissions?.length || 0} missing permission(s), ${report?.navigation?.duplicateRoutes?.length || 0} duplicate route(s), ${report?.navigation?.duplicateIds?.length || 0} duplicate id(s), ${report?.navigation?.cycles?.length || 0} cycle(s).`));
        checks.push(check('container', 'Container binding inventory', 'pass', `${report?.architecture?.containerBindings?.length || 0} explicit core service-container binding(s) indexed.`));
        const frontendEnabled = report?.settings?.analyzeFrontend !== false;
        checks.push(frontendEnabled
            ? check('frontend', 'Frontend surface inventory', report?.frontend?.bladeFiles ? 'pass' : 'warn', `${report?.frontend?.bladeFiles || 0} Blade files, ${report?.frontend?.livewire?.components?.length || 0} Livewire component(s), ${report?.frontend?.reactFiles?.length || 0} React source file(s), ${report?.frontend?.themeFamilies?.length || 0} theme family/families.`)
            : check('frontend', 'Frontend surface inventory', 'pass', 'Frontend analysis disabled by Codee settings; check skipped.', 'info'));
        checks.push(check('extensions-included', 'Extension repository scope', 'pass', 'app/Extensions/** is included as first-class Titan Zero repository evidence; secret/generated/donor source trees remain excluded.'));
        const status = checks.some(item => item.status === 'fail') ? 'red' : checks.some(item => item.status === 'warn') ? 'attention' : 'green';
        return { id: 'titan-zero-developer-intelligence', title: 'Titan Zero Developer Intelligence', summary: status, checks };
    }

    global.CodeeTitanZeroRuntimeDiagnostics = Object.freeze({ build });
})(typeof globalThis !== 'undefined' ? globalThis : this);
