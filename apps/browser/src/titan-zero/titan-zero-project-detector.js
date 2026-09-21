(function attachTitanZeroProjectDetector(global) {
    'use strict';

    function normalizePath(path) {
        return String(path || '').replace(/\\/g, '/').replace(/^\.\//, '');
    }

    function isIgnoredPath(path, ignoredPaths) {
        const normalized = normalizePath(path);
        return (ignoredPaths || []).some(prefix => normalized.startsWith(normalizePath(prefix)));
    }

    function getText(files, path) {
        const normalized = normalizePath(path);
        const value = files?.[normalized];
        if (typeof value === 'string') return value;
        if (value && typeof value.content === 'string') return value.content;
        return '';
    }

    function getPaths(input) {
        if (Array.isArray(input)) return input.map(normalizePath);
        return Object.keys(input || {}).map(normalizePath);
    }

    function parseJson(text) {
        try { return JSON.parse(text); } catch (_error) { return null; }
    }

    function packageVersion(map, name) {
        if (!map || typeof map !== 'object') return null;
        return map[name] || null;
    }

    function detect(filesOrPaths, options) {
        const profile = options?.profile || global.CodeeTitanZeroCoreProfile || {};
        const ignoredPaths = profile.ignoredPaths || [];
        const allPaths = getPaths(filesOrPaths);
        const paths = allPaths.filter(path => !isIgnoredPath(path, ignoredPaths));
        const pathSet = new Set(paths);
        const hasPrefix = prefix => paths.some(path => path.startsWith(prefix));
        const has = path => pathSet.has(normalizePath(path));

        let score = 0;
        const evidence = [];
        const add = (points, label) => { score += points; evidence.push(label); };

        if (has('artisan')) add(8, 'Laravel artisan entrypoint');
        if (has('composer.json')) add(8, 'Root Composer manifest');
        if (has('routes/panel.php')) add(12, 'Large panel route surface');
        if (has('config/themes.php')) add(8, 'Laravel theme configuration');
        if (hasPrefix('app/Domains/Titan/')) add(22, 'Titan domain namespace');
        if (has('app/Http/Controllers/TitanWorkspaceProjectController.php')) add(18, 'Titan workspace controller');
        if (hasPrefix('packages/magicai/magicai-updater/')) add(14, 'MagicAI updater package');
        if (has('config/magicaiupdater.php')) add(10, 'MagicAI updater configuration');

        const composer = parseJson(getText(filesOrPaths, 'composer.json'));
        const packageJson = parseJson(getText(filesOrPaths, 'package.json'));
        const require = composer?.require || {};
        const dev = packageJson?.devDependencies || {};
        const deps = packageJson?.dependencies || {};

        const stack = {
            php: packageVersion(require, 'php'),
            laravel: packageVersion(require, 'laravel/framework'),
            livewire: packageVersion(require, 'livewire/livewire'),
            react: packageVersion(deps, 'react'),
            reactDom: packageVersion(deps, 'react-dom'),
            vite: packageVersion(dev, 'vite'),
            tailwind: packageVersion(dev, 'tailwindcss'),
            alpine: packageVersion(deps, 'alpinejs') || packageVersion(dev, 'alpinejs') || packageVersion(deps, '@alpinejs/intersect') || packageVersion(deps, '@imacrayon/alpine-ajax')
        };

        if (stack.laravel) add(6, `Laravel ${stack.laravel}`);
        if (stack.livewire) add(4, `Livewire ${stack.livewire}`);
        if (stack.react) add(4, `React ${stack.react}`);

        return {
            recognized: score >= 40,
            confidence: Math.min(1, score / 100),
            score,
            evidence,
            stack,
            scannedFileCount: paths.length,
            ignoredFileCount: allPaths.length - paths.length,
            ignoredPaths: ignoredPaths.slice()
        };
    }

    global.CodeeTitanZeroProjectDetector = Object.freeze({
        detect,
        normalizePath,
        isIgnoredPath
    });
})(typeof globalThis !== 'undefined' ? globalThis : this);
