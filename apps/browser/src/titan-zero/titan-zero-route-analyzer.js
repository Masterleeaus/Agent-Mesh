(function attachTitanZeroRouteAnalyzer(global) {
    'use strict';

    const ROUTE_CALL = /Route::(get|post|put|patch|delete|options|any|match|resource|apiResource)\s*\(/gi;
    const ROUTE_NAME = /->name\(\s*['"]([^'"]+)['"]\s*\)/g;
    const MAX_ROUTES = 10000;
    const MAX_TRACKED_NAMES = 10000;
    const MAX_DUPLICATE_NAMES = 5000;
    const MAX_NAMES_PER_FILE = 2000;

    function normalize(path) { return String(path || '').replace(/\\/g, '/').replace(/^\.\//, ''); }
    function isRoutePath(path) { const p = normalize(path); return /^routes\/.*\.php$/i.test(p) || /^app\/Extensions\/[^/]+\/(?:routes|Routes)\/.*\.php$/i.test(p); }

    function extractRouteStatements(text, limit = MAX_ROUTES) {
        const routes = [];
        const source = String(text || '');
        const max = Math.max(0, Math.min(Number(limit) || 0, MAX_ROUTES));
        const statementRe = /Route::(get|post|put|patch|delete|options|any|match|resource|apiResource)\s*\(([^;]+?)\)\s*((?:->[^;]+?)?);/gsi;
        let match;
        while (routes.length < max && (match = statementRe.exec(source))) {
            const method = match[1].toLowerCase();
            const args = match[2];
            const chain = match[3] || '';
            const uri = (args.match(/['"]([^'"]+)['"]/) || [])[1] || null;
            const name = (chain.match(/->name\(\s*['"]([^'"]+)['"]/) || [])[1] || null;
            const controllerArray = args.match(/\[\s*([\\A-Za-z_][\\A-Za-z0-9_]*)::class\s*,\s*['"]([^'"]+)['"]\s*\]/);
            const invokable = args.match(/,\s*([\\A-Za-z_][\\A-Za-z0-9_]*)::class\s*$/);
            const middleware = [];
            for (const mw of chain.matchAll(/->middleware\(\s*(?:\[([^\]]+)\]|['"]([^'"]+)['"])\s*\)/g)) {
                if (middleware.length >= 100) break;
                if (mw[2]) middleware.push(mw[2]);
                if (mw[1]) for (const token of mw[1].matchAll(/['"]([^'"]+)['"]/g)) { if (middleware.length < 100) middleware.push(token[1]); }
            }
            routes.push({ method, uri, name, controller: controllerArray ? controllerArray[1] : invokable ? invokable[1] : null, action: controllerArray ? controllerArray[2] : invokable ? '__invoke' : null, middleware, raw: match[0].replace(/\s+/g, ' ').trim().slice(0, 500) });
        }
        return routes;
    }

    function analyze(routeFiles) {
        const files = [];
        const routes = [];
        let totalRouteCalls = 0;
        let namedRoutes = 0;
        let trackedNames = 0;
        let truncated = false;
        const duplicateNames = [];
        const nameOwners = new Map();

        for (const [rawPath, raw] of Object.entries(routeFiles || {})) {
            const path = normalize(rawPath);
            if (!isRoutePath(path)) continue;
            const text = typeof raw === 'string' ? raw : raw?.content || '';
            const methods = {};
            let match;
            while ((match = ROUTE_CALL.exec(text))) {
                const method = match[1].toLowerCase();
                methods[method] = (methods[method] || 0) + 1;
                totalRouteCalls += 1;
            }
            ROUTE_CALL.lastIndex = 0;

            const names = [];
            while ((match = ROUTE_NAME.exec(text))) {
                const name = match[1];
                namedRoutes += 1;
                if (names.length < MAX_NAMES_PER_FILE) names.push(name); else truncated = true;
                if (trackedNames < MAX_TRACKED_NAMES) {
                    trackedNames += 1;
                    if (nameOwners.has(name)) {
                        if (duplicateNames.length < MAX_DUPLICATE_NAMES) duplicateNames.push({ name, first: nameOwners.get(name), second: path }); else truncated = true;
                    } else nameOwners.set(name, path);
                } else truncated = true;
            }
            ROUTE_NAME.lastIndex = 0;

            const remaining = Math.max(0, MAX_ROUTES - routes.length);
            const parsed = extractRouteStatements(text, remaining).map(route => Object.assign({ path }, route));
            routes.push(...parsed);
            if (routes.length >= MAX_ROUTES && totalRouteCalls > routes.length) truncated = true;
            files.push({ path, routeCalls: Object.values(methods).reduce((a, b) => a + b, 0), methods, names, routes: parsed });
        }

        return { totalRouteCalls, namedRoutes, duplicateNames, files, routes, controllerRoutes: routes.filter(route => route.controller), middlewareNames: Array.from(new Set(routes.flatMap(route => route.middleware))).sort().slice(0, 5000), truncated };
    }

    global.CodeeTitanZeroRouteAnalyzer = Object.freeze({ analyze, extractRouteStatements, isRoutePath, MAX_ROUTES });
})(typeof globalThis !== 'undefined' ? globalThis : this);
