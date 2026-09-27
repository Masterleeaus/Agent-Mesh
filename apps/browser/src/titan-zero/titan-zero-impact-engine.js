(function attachTitanZeroImpactEngine(global) {
    'use strict';

    const CLASSIFIERS = Object.freeze([
        { domain: 'database', re: /^database\/migrations\/|\/Models\/|\.sql$/i, weight: 3 },
        { domain: 'tenancy', re: /\/Models\/|\/Jobs\/|\/Services\/|\/Controllers\//i, weight: 1 },
        { domain: 'routes', re: /^routes\/|\/Controllers\//i, weight: 2 },
        { domain: 'frontend', re: /^resources\/views\/|^resources\/js\/|^app\/Livewire\/|vite\.config|tailwind/i, weight: 2 },
        { domain: 'container', re: /^app\/Providers\/|^app\/Contracts\/|^app\/Services\//i, weight: 2 },
        { domain: 'auth_permissions', re: /Middleware|Policies|Permission|Role|auth\.php/i, weight: 2 },
        { domain: 'build', re: /package\.json|vite\.config|tailwind|composer\.json/i, weight: 2 },
        { domain: 'tests', re: /^tests\//i, weight: 0 }
    ]);

    function analyze(input) {
        const changedPaths = Array.from(new Set((input?.changedPaths || []).map(path => String(path).replace(/\\/g, '/'))));
        const report = input?.report || {};
        const domainEvidence = new Map();
        let score = 0;
        for (const path of changedPaths) {
            for (const classifier of CLASSIFIERS) {
                if (!classifier.re.test(path)) continue;
                if (!domainEvidence.has(classifier.domain)) domainEvidence.set(classifier.domain, []);
                domainEvidence.get(classifier.domain).push(path);
                score += classifier.weight;
            }
        }
        if (domainEvidence.has('database') && report.tenancy?.mixedBoundary) {
            if (!domainEvidence.has('tenancy')) domainEvidence.set('tenancy', []);
            domainEvidence.get('tenancy').push('mixed-schema-boundary');
            score += 2;
        }
        const migrationCritical = (report.migrations?.risks || []).some(risk => risk.severity === 'critical' && changedPaths.includes(risk.path));
        if (migrationCritical) score += 4;
        const providerChange = changedPaths.some(path => /^app\/Providers\//.test(path));
        if (providerChange) score += 2;
        const domains = Array.from(domainEvidence.keys());
        const riskLevel = score >= 10 ? 'critical' : score >= 6 ? 'high' : score >= 3 ? 'medium' : 'low';
        const recommendations = [];
        if (domains.includes('database')) recommendations.push('Compare migrations/models against the supplied schema and verify restartability/rollback before packaging.');
        if (domains.includes('tenancy')) recommendations.push('Resolve the authoritative ownership boundary for every affected table/query; never substitute company_id and tenant_company_id globally.');
        if (domains.includes('routes')) recommendations.push('Verify route names, controller actions, middleware, and any navigation references.');
        if (domains.includes('frontend')) recommendations.push('Verify Blade/Livewire/React/Vite/theme parity for every affected surface.');
        if (domains.includes('container')) recommendations.push('Verify service-provider bindings and constructor dependency resolution.');
        if (providerChange) recommendations.push('Run container/bootstrap diagnostics after provider changes.');
        return {
            changedPaths,
            domains,
            domainEvidence: Object.fromEntries(domainEvidence),
            riskScore: score,
            riskLevel,
            recommendations,
            destructiveOrCriticalMigration: migrationCritical,
            requiresApproval: riskLevel === 'critical' || domains.includes('database') || domains.includes('container')
        };
    }

    global.CodeeTitanZeroImpactEngine = Object.freeze({ analyze, CLASSIFIERS });
})(typeof globalThis !== 'undefined' ? globalThis : this);
