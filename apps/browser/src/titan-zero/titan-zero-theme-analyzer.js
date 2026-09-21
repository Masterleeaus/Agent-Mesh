(function attachTitanZeroThemeAnalyzer(global) {
    'use strict';

    function normalize(path) {
        return String(path || '').replace(/\\/g, '/').replace(/^\.\//, '');
    }

    function analyze(paths) {
        const counts = Object.create(null);
        const samples = Object.create(null);
        for (const raw of paths || []) {
            const path = normalize(raw);
            const coreMatch = path.match(/^resources\/views\/([^/]+)\/(.+)$/);
            const extMatch = path.match(/^app\/Extensions\/([^/]+)\/resources\/views\/([^/]+)\/(.+)$/i);
            if (!coreMatch && !extMatch) continue;
            const theme = extMatch ? `${extMatch[1]}/${extMatch[2]}` : coreMatch[1];
            const samplePath = extMatch ? extMatch[3] : coreMatch[2];
            if (/^(?:components|vendor)$/i.test(theme.split('/').pop())) continue;
            counts[theme] = (counts[theme] || 0) + 1;
            if (!samples[theme]) samples[theme] = [];
            if (samples[theme].length < 8) samples[theme].push(samplePath);
        }
        const themes = Object.entries(counts)
            .map(([name, viewFiles]) => ({ name, viewFiles, samples: samples[name] || [] }))
            .sort((a, b) => b.viewFiles - a.viewFiles || a.name.localeCompare(b.name));
        return { themeCount: themes.length, themes };
    }

    global.CodeeTitanZeroThemeAnalyzer = Object.freeze({ analyze });
})(typeof globalThis !== 'undefined' ? globalThis : this);
