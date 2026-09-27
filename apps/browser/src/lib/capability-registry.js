(function attachCodeeCapabilityRegistry(global) {
    'use strict';

    const stores = {
        contextProviders: new Map(),
        prompts: new Map(),
        skills: new Map(),
        profiles: new Map(),
        managers: new Map(),
        capabilities: new Map(),
        repositoryCapabilities: new Map(),
        diagnosticsSections: new Map(),
        settingsSections: new Map()
    };

    function cloneRecord(value) {
        const seen = new WeakMap();
        const copy = item => {
            if (!item || typeof item !== 'object') return item;
            if (seen.has(item)) return '[Circular]';
            const out = Array.isArray(item) ? [] : {};
            seen.set(item, out);
            for (const [key, child] of Object.entries(item)) {
                if (typeof child === 'function') continue;
                out[key] = copy(child);
            }
            return out;
        };
        return copy(value);
    }

    function cloneForStore(value, seen = new WeakMap()) {
        if (!value || typeof value !== 'object') return value;
        if (seen.has(value)) return seen.get(value);
        const out = Array.isArray(value) ? [] : {};
        seen.set(value, out);
        for (const [key, item] of Object.entries(value)) out[key] = cloneForStore(item, seen);
        return out;
    }

    function deepFreeze(value, seen = new WeakSet()) {
        if (!value || typeof value !== 'object' || seen.has(value)) return value;
        seen.add(value);
        Object.values(value).forEach(item => deepFreeze(item, seen));
        return Object.freeze(value);
    }

    function upsert(storeName, record) {
        if (!record || typeof record !== 'object' || !String(record.id || '').trim()) {
            throw new Error(`Codee capability ${storeName} records require a stable id`);
        }
        const stored = deepFreeze(cloneForStore(record));
        stores[storeName].set(String(stored.id), stored);
        return stored;
    }

    function registerMany(storeName, records) {
        const list = Array.isArray(records) ? records : [];
        list.forEach(record => upsert(storeName, record));
        return list.length;
    }

    const registry = {
        registerContextProvider(provider) { return upsert('contextProviders', provider); },
        registerPrompts(prompts) { return registerMany('prompts', prompts); },
        registerSkills(skills) { return registerMany('skills', skills); },
        registerProfiles(profiles) { return registerMany('profiles', profiles); },
        registerManager(manager) { return upsert('managers', manager); },
        registerCapability(capability) { return upsert('capabilities', capability); },
        registerRepositoryCapability(capability) { return upsert('repositoryCapabilities', capability); },
        registerDiagnosticsSection(section) { return upsert('diagnosticsSections', section); },
        registerSettingsSection(section) { return upsert('settingsSections', section); },
        getContextProviders(surface) {
            return Array.from(stores.contextProviders.values())
                .filter(provider => !surface || provider.surface === surface)
                .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));
        },
        getPrompt(id) { return stores.prompts.get(String(id || '')) || null; },
        getSkill(id) { return stores.skills.get(String(id || '')) || null; },
        getProfile(id) { return stores.profiles.get(String(id || '')) || null; },
        getManager(id) { return stores.managers.get(String(id || '')) || null; },
        getCapability(id) { return stores.capabilities.get(String(id || '')) || null; },
        getRepositoryCapability(id) { return stores.repositoryCapabilities.get(String(id || '')) || null; },
        getDiagnosticsSection(id) { return stores.diagnosticsSections.get(String(id || '')) || null; },
        getSettingsSection(id) { return stores.settingsSections.get(String(id || '')) || null; },
        snapshot() {
            return {
                contextProviders: Array.from(stores.contextProviders.values()).map(cloneRecord),
                prompts: Array.from(stores.prompts.values()).map(cloneRecord),
                skills: Array.from(stores.skills.values()).map(cloneRecord),
                profiles: Array.from(stores.profiles.values()).map(cloneRecord),
                managers: Array.from(stores.managers.values()).map(cloneRecord),
                capabilities: Array.from(stores.capabilities.values()).map(cloneRecord),
                repositoryCapabilities: Array.from(stores.repositoryCapabilities.values()).map(cloneRecord),
                diagnosticsSections: Array.from(stores.diagnosticsSections.values()).map(cloneRecord),
                settingsSections: Array.from(stores.settingsSections.values()).map(cloneRecord)
            };
        },
        clear() { Object.values(stores).forEach(store => store.clear()); }
    };

    global.CodeeCapabilityRegistry = Object.freeze(registry);
})(typeof globalThis !== 'undefined' ? globalThis : this);
