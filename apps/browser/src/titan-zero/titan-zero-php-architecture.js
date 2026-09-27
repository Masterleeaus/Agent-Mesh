(function attachTitanZeroPhpArchitecture(global) {
    'use strict';

    const MAX_USES_PER_FILE = 1000;
    const MAX_CONSTRUCTOR_DEPS_PER_FILE = 500;
    const MAX_BINDINGS = 1000;
    const MAX_DEPENDENCY_EDGES = 20000;

    function normalize(path) { return String(path || '').replace(/\\/g, '/').replace(/^\.\//, ''); }
    function ignored(path) { return global.CodeeTitanZeroSnapshotPolicy?.shouldIgnore?.(path) || false; }

    function parseNamespace(text) { return (String(text || '').match(/\bnamespace\s+([^;]+);/) || [])[1] || null; }
    function parseClass(text) { return (String(text || '').match(/\b(?:final\s+|abstract\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)/) || [])[1] || null; }
    function parseUses(text, limit = MAX_USES_PER_FILE) {
        const uses = [];
        const re = /^\s*use\s+([^;]+);/gm;
        let match;
        const source = String(text || '');
        while (uses.length < limit && (match = re.exec(source))) {
            const item = match[1].trim();
            if (!item.startsWith('function ')) uses.push(item);
        }
        return uses;
    }
    function fqcn(text) {
        const ns = parseNamespace(text);
        const cls = parseClass(text);
        return cls ? (ns ? `${ns}\\${cls}` : cls) : null;
    }
    function constructorDependencies(text, limit = MAX_CONSTRUCTOR_DEPS_PER_FILE) {
        const match = String(text || '').match(/function\s+__construct\s*\(([^)]*)\)/s);
        if (!match) return [];
        const deps = [];
        const re = /(?:(?:public|protected|private)\s+)?(?:readonly\s+)?([\\A-Za-z_][\\A-Za-z0-9_]*)\s+\$([A-Za-z_][A-Za-z0-9_]*)/g;
        let dep;
        while (deps.length < limit && (dep = re.exec(match[1]))) deps.push({ type: dep[1], parameter: dep[2] });
        return deps;
    }
    function bindingCalls(text, path, limit = MAX_BINDINGS) {
        const bindings = [];
        const re = /\$this->app->(bind|singleton|scoped|instance)\s*\(\s*([^,\n]+?)\s*,\s*([^\)\n]+?)\s*\)/g;
        let match;
        const source = String(text || '');
        while (bindings.length < limit && (match = re.exec(source))) {
            const clean = value => String(value).replace(/::class/g, '').replace(/["']/g, '').trim();
            bindings.push({ path, method: match[1], abstract: clean(match[2]), concrete: clean(match[3]) });
        }
        return bindings;
    }
    function classify(path) {
        const normalized = normalize(path);
        const ext = normalized.match(/^app\/Extensions\/[^/]+\/(.+)$/i);
        const tail = ext ? ext[1] : normalized.replace(/^app\//, '');
        if (/^(?:app\/)?(?:Http\/)?Controllers\//i.test(tail)) return 'controller';
        if (/^(?:app\/)?Models\//i.test(tail)) return 'model';
        if (/^(?:app\/)?Services\//i.test(tail)) return 'service';
        if (/^(?:app\/)?Providers\//i.test(tail)) return 'service_provider';
        if (/^(?:app\/)?Http\/Middleware\//i.test(tail) || /^(?:app\/)?Middleware\//i.test(tail)) return 'middleware';
        if (/^(?:app\/)?Jobs\//i.test(tail)) return 'job';
        if (/^(?:app\/)?Livewire\//i.test(tail)) return 'livewire';
        if (/^(?:app\/)?Console\//i.test(tail)) return 'console';
        if (/^(?:app\/)?Policies\//i.test(tail)) return 'policy';
        return 'php';
    }
    function analyze(files) {
        const nodes = [];
        const containerBindings = [];
        let truncated = false;
        for (const [rawPath, source] of Object.entries(files || {})) {
            const path = normalize(rawPath);
            if (ignored(path) || !/^app\/.*\.php$/i.test(path)) continue;
            const text = String(source || '');
            const kind = classify(path);
            const uses = parseUses(text);
            const deps = constructorDependencies(text);
            if (uses.length >= MAX_USES_PER_FILE && /^\s*use\s+/m.test(text.slice(text.indexOf(uses[uses.length - 1] || '') + 1))) truncated = true;
            if (deps.length >= MAX_CONSTRUCTOR_DEPS_PER_FILE) truncated = true;
            const node = { path, kind, fqcn: fqcn(text), namespace: parseNamespace(text), className: parseClass(text), uses, constructorDependencies: deps };
            nodes.push(node);
            if (kind === 'service_provider') {
                const remaining = MAX_BINDINGS - containerBindings.length;
                if (remaining <= 0) { truncated = true; continue; }
                const bindings = bindingCalls(text, path, remaining);
                containerBindings.push(...bindings);
                if (bindings.length >= remaining) truncated = true;
            }
        }
        const byKind = kind => nodes.filter(node => node.kind === kind);
        const dependencyEdges = [];
        for (const node of nodes) {
            for (const dep of node.constructorDependencies) {
                if (dependencyEdges.length >= MAX_DEPENDENCY_EDGES) { truncated = true; break; }
                dependencyEdges.push({ from: node.fqcn || node.path, to: dep.type, kind: 'constructor' });
            }
            if (dependencyEdges.length >= MAX_DEPENDENCY_EDGES) break;
        }
        return {
            nodes,
            controllers: byKind('controller'),
            models: byKind('model'),
            services: byKind('service'),
            serviceProviders: byKind('service_provider'),
            middleware: byKind('middleware'),
            jobs: byKind('job'),
            livewire: byKind('livewire'),
            policies: byKind('policy'),
            containerBindings,
            dependencyEdges,
            truncated,
            stats: Object.fromEntries(['controller','model','service','service_provider','middleware','job','livewire','policy'].map(kind => [kind, byKind(kind).length]))
        };
    }

    global.CodeeTitanZeroPhpArchitecture = Object.freeze({
        analyze, parseNamespace, parseClass, parseUses, constructorDependencies, bindingCalls,
        MAX_USES_PER_FILE, MAX_CONSTRUCTOR_DEPS_PER_FILE, MAX_BINDINGS, MAX_DEPENDENCY_EDGES
    });
})(typeof globalThis !== 'undefined' ? globalThis : this);
