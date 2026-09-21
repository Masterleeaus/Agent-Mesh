(function attachTitanZeroNavigationAnalyzer(global) {
    'use strict';

    function normalizeRoute(value) { return String(value || '').trim(); }
    function parentValue(row) { return row?.parent_id ?? row?.parentId ?? null; }
    function routeValue(row) { return normalizeRoute(row?.route || row?.route_name); }
    function titleValue(row) { return row?.title ?? row?.label ?? row?.name ?? null; }
    function analyze(input, routeReport) {
        const rows = Array.isArray(input?.navigation) ? input.navigation : [];
        const permissionSet = new Set(Array.isArray(input?.permissions) ? input.permissions.map(String) : []);
        const routeNames = new Set((routeReport?.routes || []).map(route => route.name).filter(Boolean));
        const ids = new Set();
        const duplicateIds = [];
        const byId = new Map();
        for (const row of rows) {
            const id = String(row?.id);
            if (ids.has(id)) duplicateIds.push({ id: row?.id, title: titleValue(row) });
            else { ids.add(id); byId.set(id, row); }
        }
        const brokenParents = [];
        const missingRoutes = [];
        const missingPermissions = [];
        const duplicateRoutes = [];
        const seenRoutes = new Map();
        for (const row of rows) {
            const parentId = parentValue(row);
            const title = titleValue(row);
            if (parentId !== null && parentId !== undefined && parentId !== '' && !ids.has(String(parentId))) brokenParents.push({ id: row.id, parent_id: parentId, title });
            const route = routeValue(row);
            if (route && !routeNames.has(route)) missingRoutes.push({ id: row.id, route, title });
            const permission = String(row.permission || '').trim();
            if (permission && permissionSet.size && !permissionSet.has(permission)) missingPermissions.push({ id: row.id, permission, title });
            if (route) {
                if (seenRoutes.has(route)) duplicateRoutes.push({ route, ids: [seenRoutes.get(route), row.id] });
                else seenRoutes.set(route, row.id);
            }
        }
        const children = new Map();
        for (const row of rows) {
            const parentId = parentValue(row);
            const parent = parentId === null || parentId === undefined || parentId === '' ? 'root' : String(parentId);
            if (!children.has(parent)) children.set(parent, []);
            children.get(parent).push(row);
        }
        const cycles = [];
        const cycleKeys = new Set();
        function depth(row) {
            let current = row;
            let level = 1;
            const path = [];
            const positions = new Map();
            while (current) {
                const id = String(current?.id);
                if (positions.has(id)) {
                    const cycleIds = path.slice(positions.get(id));
                    const key = cycleIds.slice().sort().join('|');
                    if (!cycleKeys.has(key)) {
                        cycleKeys.add(key);
                        cycles.push({ ids: cycleIds, titles: cycleIds.map(item => titleValue(byId.get(item))) });
                    }
                    return null;
                }
                positions.set(id, path.length);
                path.push(id);
                const parentId = parentValue(current);
                if (parentId === null || parentId === undefined || parentId === '') return level;
                const parent = byId.get(String(parentId));
                if (!parent) return level;
                current = parent;
                level += 1;
            }
            return level;
        }
        const depths = rows.map(depth).filter(value => Number.isFinite(value));
        return {
            items: rows.length,
            permissionCount: permissionSet.size,
            brokenParents,
            missingRoutes,
            missingPermissions,
            duplicateRoutes,
            duplicateIds,
            cycles,
            maxDepth: depths.length ? Math.max(...depths) : 0,
            roots: children.get('root') || [],
            sourcePolicy: 'Analyze only explicitly supplied safe navigation/permission metadata; do not scrape arbitrary SQL row values.'
        };
    }

    global.CodeeTitanZeroNavigationAnalyzer = Object.freeze({ analyze, parentValue, routeValue, titleValue });
})(typeof globalThis !== 'undefined' ? globalThis : this);
