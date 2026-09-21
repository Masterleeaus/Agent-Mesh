(function attachTitanZeroFrontendAnalyzer(global) {
    'use strict';
    const MAX_DETAIL_ITEMS = 5000;
    function normalize(path) { return String(path || '').replace(/\\/g, '/').replace(/^\.\//, ''); }
    function ignored(path) { return global.CodeeTitanZeroSnapshotPolicy?.shouldIgnore?.(path) || false; }
    function extensionParts(path) { const match = normalize(path).match(/^app\/Extensions\/([^/]+)\/(.+)$/i); return match ? { extension: match[1], tail: match[2] } : null; }
    function themeFamily(path) { const normalized = normalize(path); const extension = extensionParts(normalized); const viewPath = extension ? extension.tail : normalized; const match = viewPath.match(/^resources\/views\/([^/]+)\/(.+\.blade\.php)$/i); if (!match || ['components','vendor','livewire','layouts'].includes(match[1].toLowerCase())) return null; return extension ? `${extension.extension}/${match[1]}` : match[1]; }
    function isLivewireTemplate(path) { const normalized = normalize(path); return /^resources\/views\/livewire\//i.test(normalized) || /^app\/Extensions\/[^/]+\/resources\/views\/livewire\//i.test(normalized); }
    function isLivewireComponent(path) { const normalized = normalize(path); return /^app\/Livewire\/.*\.php$/i.test(normalized) || /^app\/Extensions\/[^/]+\/(?:app\/)?Livewire\/.*\.php$/i.test(normalized); }
    function analyze(files) {
        const blades = [], reactFiles = [], alpineFiles = [], tailwindFiles = [], livewireTemplates = [], livewireTags = [], bladeComponents = [], viteEntries = [];
        const themes = new Map(); let truncated = false;
        const boundedPush = (array, value) => { if (array.length < MAX_DETAIL_ITEMS) array.push(value); else truncated = true; };
        for (const [rawPath, source] of Object.entries(files || {})) {
            const path = normalize(rawPath); if (ignored(path)) continue; const text = String(source || '');
            if (/\.blade\.php$/i.test(path)) {
                boundedPush(blades, path);
                if (isLivewireTemplate(path)) boundedPush(livewireTemplates, path);
                for (const match of text.matchAll(/<livewire:([A-Za-z0-9_.:-]+)/g)) boundedPush(livewireTags, { path, component: match[1] });
                for (const match of text.matchAll(/<x-([A-Za-z0-9_.:-]+)/g)) boundedPush(bladeComponents, { path, component: match[1] });
                if (/\bx-data\s*=|\bx-on:|@click|\bx-show\b/.test(text)) boundedPush(alpineFiles, path);
                if (/class\s*=\s*["'][^"']*(?:p-|m-|grid|flex|text-|bg-|rounded|shadow)/.test(text)) boundedPush(tailwindFiles, path);
                const family = themeFamily(path); if (family) themes.set(family, (themes.get(family) || 0) + 1);
            }
            if (/\.(?:jsx|tsx)$/i.test(path) || (/\.js$/i.test(path) && /from\s+['"]react['"]|React\./.test(text))) boundedPush(reactFiles, path);
            if (/vite\.config\.(?:m?js|ts)$/i.test(path)) for (const match of text.matchAll(/['"](resources\/(?:js|css)\/[^'"]+)['"]/g)) boundedPush(viteEntries, match[1]);
        }
        const livewireComponents = []; for (const path of Object.keys(files || {})) { if (!ignored(path) && isLivewireComponent(path)) boundedPush(livewireComponents, { path }); }
        const themeFamilies = Array.from(themes.entries()).map(([name, viewFiles]) => ({ name, viewFiles })).sort((a,b) => b.viewFiles - a.viewFiles || a.name.localeCompare(b.name)).slice(0, MAX_DETAIL_ITEMS);
        if (themes.size > MAX_DETAIL_ITEMS) truncated = true;
        return { bladeFiles: blades.length, blades, livewire: { components: livewireComponents, templates: livewireTemplates, tags: livewireTags }, reactFiles, alpineFiles: Array.from(new Set(alpineFiles)), tailwindFiles: Array.from(new Set(tailwindFiles)), bladeComponents, viteEntries: Array.from(new Set(viteEntries)), themeFamilies, truncated, stacksDetected: { blade: blades.length > 0, livewire: livewireComponents.length > 0 || livewireTemplates.length > 0, react: reactFiles.length > 0, alpine: alpineFiles.length > 0, tailwind: tailwindFiles.length > 0, vite: viteEntries.length > 0 || Object.keys(files || {}).some(path => /vite\.config\./.test(path)) } };
    }
    global.CodeeTitanZeroFrontendAnalyzer = Object.freeze({ analyze, themeFamily, isLivewireTemplate, isLivewireComponent, MAX_DETAIL_ITEMS });
})(typeof globalThis !== 'undefined' ? globalThis : this);
