(function attachTitanZeroTestMatrix(global) {
    'use strict';

    function command(id, commandText, reason, severity, mutating, executionMode) {
        const writesState = mutating === true;
        return { id, command: commandText, reason, severity: severity || 'required', mode: 'recommendation', mutating: writesState, requiresApproval: writesState, executionMode: executionMode || 'safe_channel' };
    }
    function addUnique(list, item) {
        if (!list.some(existing => existing.command === item.command)) list.push(item);
    }
    function has(files, path) { return Object.prototype.hasOwnProperty.call(files || {}, path); }

    function build(impact, options) {
        const domains = new Set(impact?.domains || []);
        const files = options?.files || {};
        const commands = [];
        addUnique(commands, command('php-syntax', "find app routes database/migrations -name '*.php' -print0 | xargs -0 -n1 php -l", 'Catch PHP parse errors across core and extension-owned source.', 'required', false, 'external_shell'));
        if (has(files, 'composer.json')) addUnique(commands, command('composer-validate', 'composer validate --no-check-publish', 'Validate Composer metadata before host-level changes.', 'recommended'));
        if (domains.has('database')) {
            addUnique(commands, command('migration-status', 'php artisan migrate:status', 'Compare migration state before applying schema changes.', 'required'));
            addUnique(commands, command('database-tests', 'php artisan test --testsuite=Feature', 'Run feature coverage after model/migration/query changes.', 'required'));
        }
        if (domains.has('routes') || domains.has('auth_permissions')) addUnique(commands, command('route-list', 'php artisan route:list', 'Verify route registration, names, middleware, and controller resolution.', 'required'));
        if (domains.has('container')) addUnique(commands, command('bootstrap-check', 'php artisan about', 'Force Laravel bootstrap/container resolution without mutating application state.', 'required'));
        if (domains.has('frontend')) {
            if (has(files, 'package.json')) addUnique(commands, command('frontend-build', 'npm run build', 'Verify Vite/React/Tailwind asset compilation.', 'required', true));
            addUnique(commands, command('view-cache', 'php artisan view:cache', 'Compile Blade views to catch template errors.', 'recommended', true));
        }
        if (has(files, 'phpunit.xml') || Object.keys(files).some(path => /^tests\//.test(path))) addUnique(commands, command('tests', 'php artisan test', 'Run host application tests selected by the receiving agent.', 'required'));
        return {
            commands,
            requiredCount: commands.filter(item => item.severity === 'required').length,
            domains: Array.from(domains),
            executionPolicy: 'Commands are recommendations only. The receiving Codee tool/approval system decides whether and where to execute them.'
        };
    }

    global.CodeeTitanZeroTestMatrix = Object.freeze({ build });
})(typeof globalThis !== 'undefined' ? globalThis : this);
