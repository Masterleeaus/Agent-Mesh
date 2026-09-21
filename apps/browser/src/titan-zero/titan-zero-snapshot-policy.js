(function attachTitanZeroSnapshotPolicy(global) {
    'use strict';

    const ALWAYS_READ = Object.freeze([
        'composer.json',
        'package.json',
        'vite.config.mjs',
        'routes/api.php',
        'routes/auth.php',
        'routes/panel.php',
        'routes/web.php',
        'routes/webhooks.php',
        'config/themes.php',
        'config/livewire.php',
        'config/database.php',
        'config/auth.php'
    ]);

    const INDEX_PREFIXES = Object.freeze([
        'app/Domains/',
        'app/Http/Controllers/',
        'app/Http/Middleware/',
        'app/Livewire/',
        'app/Models/',
        'app/Providers/',
        'app/Services/',
        'app/Extensions/',
        'resources/views/',
        'resources/js/',
        'database/migrations/'
    ]);

    function unsafe(path) {
        const raw = String(path || '').replace(/\\/g, '/');
        return !raw || raw.includes('\0') || raw.startsWith('/') || /^[A-Za-z]:\//.test(raw) || raw.split('/').some(segment => segment === '..');
    }

    function normalize(path) {
        return String(path || '').replace(/\\/g, '/').split('/').filter(segment => segment && segment !== '.').join('/');
    }

    function shouldIgnore(path) {
        if (unsafe(path)) return true;
        const normalized = normalize(path);
        const lower = normalized.toLowerCase();
        return lower.startsWith('integration-sources/')
            || lower.startsWith('donor-extracted/')
            || lower.includes('/node_modules/')
            || lower.startsWith('node_modules/')
            || lower.includes('/vendor/')
            || lower.startsWith('vendor/')
            || lower.startsWith('storage/logs/')
            || lower === '.env'
            || lower.startsWith('.env.')
            || lower.endsWith('.log')
            || lower.startsWith('.git/');
    }

    function shouldIndex(path) {
        const normalized = normalize(path);
        if (shouldIgnore(normalized)) return false;
        return ALWAYS_READ.includes(normalized) || INDEX_PREFIXES.some(prefix => normalized.startsWith(prefix));
    }

    function selectIndexPaths(paths) {
        return (paths || []).map(normalize).filter(shouldIndex);
    }

    global.CodeeTitanZeroSnapshotPolicy = Object.freeze({
        ALWAYS_READ,
        INDEX_PREFIXES,
        unsafe,
        normalize,
        shouldIgnore,
        shouldIndex,
        selectIndexPaths
    });
})(typeof globalThis !== 'undefined' ? globalThis : this);
