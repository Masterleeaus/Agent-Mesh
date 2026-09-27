/*
 * Titan Zero Generative UI Runtime
 * Architectural patterns adapted from json-render (Apache-2.0).
 * Reimplemented for the Titan Zero Laravel/Blade UI builder.
 * Presentation-only: actions emit intents and never write business records.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.TitanGenerativeUI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const componentRegistry = Object.create(null);
    const DEFAULT_ALLOWED_ACTIONS = new Set([
        'navigate', 'open-modal', 'open-drawer', 'filter', 'search', 'sort',
        'export-preview', 'builder.edit', 'builder.preview', 'builder.publish', 'builder.rollback', 'builder.theme.update', 'crm.customer.create',
        'crm.work_order.create', 'crm.work_order.assign',
        'crm.work_order.task.complete', 'titanmoney.quotes.create',
        'titanmoney.invoices.issue', 'zeropay.payment-intent.create',
        'communications.message.send', 'state.set', 'state.toggle', 'state.increment',
        'state.append', 'state.remove', 'state.merge', 'state.reset', 'state.undo', 'state.redo',
        'ui.next-page', 'ui.previous-page', 'ui.expand', 'ui.collapse', 'ui.copy-spec',
        'ui.open-canvas', 'form.submit-preview'
    ]);

    const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
    const clone = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
    const escapePointerToken = (value) => String(value).replace(/~/g, '~0').replace(/\//g, '~1');
    const unescapePointerToken = (value) => String(value).replace(/~1/g, '/').replace(/~0/g, '~');

    function parsePointer(path) {
        if (path === '' || path === '/') return [];
        if (typeof path !== 'string' || !path.startsWith('/')) throw new Error('JSON Pointer must start with /.');
        return path.slice(1).split('/').map(unescapePointerToken);
    }

    function getByPath(value, path) {
        const parts = parsePointer(path);
        let current = value;
        for (const part of parts) {
            if (current === null || current === undefined) return undefined;
            current = current[Array.isArray(current) && /^\d+$/.test(part) ? Number(part) : part];
        }
        return current;
    }

    function setByPath(source, path, value) {
        const parts = parsePointer(path);
        if (parts.length === 0) return clone(value);
        const next = Array.isArray(source) ? source.slice() : { ...(source || {}) };
        let cursor = next;
        for (let index = 0; index < parts.length - 1; index += 1) {
            const part = parts[index];
            const nextPart = parts[index + 1];
            const existing = cursor[part];
            const child = Array.isArray(existing)
                ? existing.slice()
                : isObject(existing)
                    ? { ...existing }
                    : /^\d+$/.test(nextPart)
                        ? []
                        : {};
            cursor[part] = child;
            cursor = child;
        }
        const last = parts[parts.length - 1];
        if (Array.isArray(cursor) && last === '-') cursor.push(clone(value));
        else cursor[last] = clone(value);
        return next;
    }

    function removeByPath(source, path) {
        const parts = parsePointer(path);
        if (parts.length === 0) return {};
        const next = Array.isArray(source) ? source.slice() : { ...(source || {}) };
        let cursor = next;
        for (let index = 0; index < parts.length - 1; index += 1) {
            const part = parts[index];
            const existing = cursor[part];
            if (existing === undefined) return next;
            cursor[part] = Array.isArray(existing) ? existing.slice() : { ...existing };
            cursor = cursor[part];
        }
        const last = parts[parts.length - 1];
        if (Array.isArray(cursor) && /^\d+$/.test(last)) cursor.splice(Number(last), 1);
        else delete cursor[last];
        return next;
    }

    function createStateStore(initialState) {
        let state = clone(initialState || {});
        const listeners = new Set();
        const notify = () => listeners.forEach((listener) => listener(state));
        return {
            get(path) { return getByPath(state, path); },
            set(path, value) {
                const current = getByPath(state, path);
                if (current === value) return;
                state = setByPath(state, path, value);
                notify();
            },
            update(updates) {
                let next = state;
                let changed = false;
                Object.entries(updates || {}).forEach(([path, value]) => {
                    if (getByPath(next, path) !== value) {
                        next = setByPath(next, path, value);
                        changed = true;
                    }
                });
                if (changed) { state = next; notify(); }
            },
            remove(path) { state = removeByPath(state, path); notify(); },
            getSnapshot() { return state; },
            replace(next) { state = clone(next || {}); notify(); },
            subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
        };
    }

    function normaliseSpec(input, options) {
        const source = isObject(input) ? clone(input) : {};
        const elements = isObject(source.elements) ? source.elements : {};
        const root = typeof source.root === 'string' && source.root ? source.root : Object.keys(elements)[0] || 'root';
        const version = source.version === '1.0' || source.version === '1.1' ? '1.1' : '1.1';
        return {
            ...source,
            version,
            surface: ['chat', 'builder', 'page', 'canvas', 'mobile', 'preview'].includes(source.surface) ? source.surface : (options?.surface || 'chat'),
            authority: 'presentation-only',
            root,
            state: isObject(source.state) ? source.state : {},
            data: isObject(source.data) ? source.data : undefined,
            meta: isObject(source.meta) ? source.meta : {},
            persistence: source.persistence === false ? false : (isObject(source.persistence) ? source.persistence : {}),
            elements,
        };
    }

    function createPersistentStateStore(initialState, options) {
        const config = options || {};
        const storage = config.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
        const key = String(config.key || 'titan-generative-ui-state');
        const historyLimit = Math.max(1, Math.min(100, Number(config.historyLimit || 30)));
        const baseline = clone(initialState || {});
        let restored = baseline;
        if (storage) {
            try {
                const payload = JSON.parse(storage.getItem(key) || 'null');
                if (isObject(payload) && isObject(payload.state)) restored = payload.state;
            } catch (_) {}
        }
        const store = createStateStore(restored);
        let past = [];
        let future = [];
        let previous = clone(store.getSnapshot());
        let replaying = false;
        const persist = (state) => {
            if (!storage) return;
            try { storage.setItem(key, JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), state })); } catch (_) {}
        };
        const unsubscribe = store.subscribe((state) => {
            if (!replaying && JSON.stringify(previous) !== JSON.stringify(state)) {
                past.push(previous);
                if (past.length > historyLimit) past.shift();
                future = [];
            }
            previous = clone(state);
            persist(state);
        });
        const replaceFromHistory = (state) => {
            replaying = true;
            store.replace(state);
            previous = clone(state);
            replaying = false;
        };
        return {
            ...store,
            undo() {
                if (!past.length) return false;
                const target = past.pop();
                future.push(clone(store.getSnapshot()));
                replaceFromHistory(target);
                return true;
            },
            redo() {
                if (!future.length) return false;
                const target = future.pop();
                past.push(clone(store.getSnapshot()));
                replaceFromHistory(target);
                return true;
            },
            reset() {
                past.push(clone(store.getSnapshot()));
                future = [];
                replaceFromHistory(baseline);
                persist(baseline);
            },
            clearPersistence() { try { storage?.removeItem(key); } catch (_) {} },
            canUndo() { return past.length > 0; },
            canRedo() { return future.length > 0; },
            destroy() { unsubscribe(); },
        };
    }

    function createSpecController(initialSpec, options) {
        const limit = Math.max(1, Math.min(100, Number(options?.historyLimit || 30)));
        let spec = normaliseSpec(initialSpec, options);
        let past = [];
        let future = [];
        const listeners = new Set();
        const notify = () => listeners.forEach((listener) => listener(clone(spec)));
        const commit = (next) => {
            past.push(clone(spec));
            if (past.length > limit) past.shift();
            future = [];
            spec = normaliseSpec(next, options);
            notify();
            return spec;
        };
        return {
            getSpec() { return clone(spec); },
            replace(next) { return commit(next); },
            merge(patch) { return commit(deepMerge(spec, patch)); },
            patch(operations) { return commit(applyJsonPatch(spec, operations)); },
            undo() {
                if (!past.length) return false;
                future.push(clone(spec));
                spec = past.pop();
                notify();
                return true;
            },
            redo() {
                if (!future.length) return false;
                past.push(clone(spec));
                spec = future.pop();
                notify();
                return true;
            },
            subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
            canUndo() { return past.length > 0; },
            canRedo() { return future.length > 0; },
        };
    }

    function itemValue(item, path) {
        if (path === '' || path === undefined) return item;
        const pointer = path.startsWith('/') ? path : `/${path.split('.').map(escapePointerToken).join('/')}`;
        return getByPath(item, pointer);
    }

    function formatValue(config, context) {
        const value = resolveValue(config.value, context);
        const style = config.style || 'text';
        const locale = config.locale || 'en-AU';
        if (value === null || value === undefined) return config.fallback ?? '';
        if (style === 'currency') {
            return new Intl.NumberFormat(locale, { style: 'currency', currency: config.currency || 'AUD' }).format(Number(value));
        }
        if (style === 'number') return new Intl.NumberFormat(locale, config.options || {}).format(Number(value));
        if (style === 'date') {
            const date = new Date(value);
            return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat(locale, config.options || { dateStyle: 'medium' }).format(date);
        }
        if (style === 'uppercase') return String(value).toLocaleUpperCase(locale);
        if (style === 'lowercase') return String(value).toLocaleLowerCase(locale);
        if (style === 'truncate') {
            const limit = Math.max(1, Number(config.length || 80));
            const text = String(value);
            return text.length > limit ? `${text.slice(0, limit)}…` : text;
        }
        if (style === 'plural') return Number(value) === 1 ? config.one : (config.other || `${value}`);
        return String(value);
    }

    function mathValue(config, context) {
        const values = (config.values || []).map((value) => Number(resolveValue(value, context) || 0));
        switch (config.op) {
            case 'subtract': return values.slice(1).reduce((total, value) => total - value, values[0] || 0);
            case 'multiply': return values.reduce((total, value) => total * value, 1);
            case 'divide': return values.slice(1).reduce((total, value) => value === 0 ? total : total / value, values[0] || 0);
            case 'min': return values.length ? Math.min(...values) : 0;
            case 'max': return values.length ? Math.max(...values) : 0;
            case 'round': return Math.round(values[0] || 0);
            case 'sum':
            case 'add':
            default: return values.reduce((total, value) => total + value, 0);
        }
    }

    function resolveValue(value, context) {
        const ctx = context || {};
        if (Array.isArray(value)) return value.map((entry) => resolveValue(entry, ctx));
        if (!isObject(value)) return value;
        if (Object.keys(value).length === 1 && '$state' in value) return getByPath(ctx.state || {}, value.$state);
        if (Object.keys(value).length === 1 && '$data' in value) return getByPath(ctx.data || {}, value.$data);
        if (Object.keys(value).length === 1 && '$env' in value) return getByPath(ctx.env || {}, value.$env);
        if (Object.keys(value).length === 1 && '$item' in value) return itemValue(ctx.item, value.$item);
        if (Object.keys(value).length === 1 && '$index' in value) return ctx.index;
        if ('$if' in value) {
            const config = value.$if || {};
            return evaluateVisibility(config.condition, ctx) ? resolveValue(config.then, ctx) : resolveValue(config.else, ctx);
        }
        if ('$coalesce' in value) {
            for (const entry of value.$coalesce || []) { const resolved = resolveValue(entry, ctx); if (resolved !== null && resolved !== undefined) return resolved; }
            return null;
        }
        if ('$concat' in value) return (value.$concat || []).map((entry) => resolveValue(entry, ctx) ?? '').join('');
        if ('$join' in value) {
            const values = resolveValue(value.$join.values || [], ctx);
            return Array.isArray(values) ? values.join(value.$join.separator ?? ', ') : String(values ?? '');
        }
        if ('$format' in value) return formatValue(value.$format, ctx);
        if ('$math' in value) return mathValue(value.$math, ctx);
        const resolved = {};
        Object.entries(value).forEach(([key, entry]) => { resolved[key] = resolveValue(entry, ctx); });
        return resolved;
    }

    function comparisonValue(condition, context) {
        if ('$state' in condition) return getByPath(context.state || {}, condition.$state);
        if ('$data' in condition) return getByPath(context.data || {}, condition.$data);
        if ('$env' in condition) return getByPath(context.env || {}, condition.$env);
        if ('$item' in condition) return itemValue(context.item, condition.$item);
        if ('$index' in condition) return context.index;
        return undefined;
    }

    function compareCondition(condition, context) {
        const actual = comparisonValue(condition, context);
        let result;
        if ('eq' in condition) result = actual === resolveValue(condition.eq, context);
        else if ('neq' in condition) result = actual !== resolveValue(condition.neq, context);
        else if ('gt' in condition) result = Number(actual) > Number(resolveValue(condition.gt, context));
        else if ('gte' in condition) result = Number(actual) >= Number(resolveValue(condition.gte, context));
        else if ('lt' in condition) result = Number(actual) < Number(resolveValue(condition.lt, context));
        else if ('lte' in condition) result = Number(actual) <= Number(resolveValue(condition.lte, context));
        else if ('includes' in condition) result = Array.isArray(actual)
            ? actual.includes(resolveValue(condition.includes, context))
            : String(actual ?? '').includes(String(resolveValue(condition.includes, context) ?? ''));
        else result = Boolean(actual);
        return condition.not === true ? !result : result;
    }

    function evaluateVisibility(condition, context) {
        if (condition === undefined || condition === true) return true;
        if (condition === false || condition === null) return false;
        if (Array.isArray(condition)) return condition.every((entry) => evaluateVisibility(entry, context));
        if (!isObject(condition)) return Boolean(condition);
        if ('$and' in condition) return (condition.$and || []).every((entry) => evaluateVisibility(entry, context));
        if ('$or' in condition) return (condition.$or || []).some((entry) => evaluateVisibility(entry, context));
        return compareCondition(condition, context || {});
    }

    function validateField(value, checks, state) {
        const errors = [];
        (checks || []).forEach((check) => {
            const type = check.type;
            let invalid = false;
            if (type === 'required') invalid = value === null || value === undefined || String(value).trim() === '';
            else if (type === 'email') invalid = value !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
            else if (type === 'matches' || type === 'equalTo') invalid = value !== getByPath(state || {}, check.path);
            else if (type === 'lessThan') invalid = Number(value) >= Number(getByPath(state || {}, check.path));
            else if (type === 'greaterThan') invalid = Number(value) <= Number(getByPath(state || {}, check.path));
            else if (type === 'requiredIf') {
                const compare = getByPath(state || {}, check.path);
                invalid = compare === check.equals && (value === null || value === undefined || String(value).trim() === '');
            } else if (type === 'minLength') invalid = String(value ?? '').length < Number(check.value || 0);
            else if (type === 'maxLength') invalid = String(value ?? '').length > Number(check.value || Infinity);
            else if (type === 'pattern') {
                try { invalid = !new RegExp(check.value).test(String(value ?? '')); } catch (_) { invalid = true; }
            }
            if (invalid) errors.push(check.message || 'Invalid value');
        });
        return errors;
    }

    function deepMerge(base, patch) {
        if (!isObject(patch)) return clone(patch);
        const output = isObject(base) ? { ...base } : {};
        Object.entries(patch).forEach(([key, value]) => {
            if (value === null) delete output[key];
            else if (isObject(value)) output[key] = deepMerge(output[key], value);
            else output[key] = clone(value);
        });
        return output;
    }

    function applyJsonPatch(documentValue, patches) {
        let document = clone(documentValue);
        (patches || []).forEach((patch) => {
            if (!patch || typeof patch.path !== 'string') throw new Error('Invalid JSON Patch operation.');
            if (patch.op === 'add' || patch.op === 'replace') document = setByPath(document, patch.path, patch.value);
            else if (patch.op === 'remove') document = removeByPath(document, patch.path);
            else if (patch.op === 'copy') document = setByPath(document, patch.path, getByPath(document, patch.from));
            else if (patch.op === 'move') {
                const value = getByPath(document, patch.from);
                document = removeByPath(document, patch.from);
                document = setByPath(document, patch.path, value);
            } else if (patch.op === 'test') {
                if (JSON.stringify(getByPath(document, patch.path)) !== JSON.stringify(patch.value)) throw new Error(`JSON Patch test failed at ${patch.path}.`);
            } else throw new Error(`Unsupported JSON Patch operation: ${patch.op}`);
        });
        return document;
    }

    function extractSpec(text) {
        const source = String(text || '');
        const match = source.match(/```titan-ui\s*([\s\S]*?)```/i);
        if (!match) return { spec: null, fallbackText: source.trim(), error: null };
        const fallbackText = source.replace(match[0], '').trim();
        try {
            const spec = JSON.parse(match[1].trim());
            return { spec, fallbackText, error: null };
        } catch (error) {
            return { spec: null, fallbackText: source.trim(), error: error instanceof Error ? error.message : 'Invalid UI JSON.' };
        }
    }

    function safeUrl(value) {
        const url = String(value || '#').trim();
        if (url.startsWith('/') || url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) return url;
        try {
            const parsed = new URL(url, typeof location !== 'undefined' ? location.origin : 'https://example.invalid');
            return ['http:', 'https:'].includes(parsed.protocol) ? url : '#';
        } catch (_) { return '#'; }
    }

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined && text !== null) node.textContent = String(text);
        return node;
    }

    function registerComponent(name, renderer) {
        if (!/^[a-z0-9-]+$/.test(name) || typeof renderer !== 'function') throw new Error('Invalid component registration.');
        componentRegistry[name] = renderer;
    }

    function emitAction(binding, context, event) {
        const actions = Array.isArray(binding) ? binding : [binding];
        actions.forEach((actionBinding) => {
            if (!actionBinding || !DEFAULT_ALLOWED_ACTIONS.has(actionBinding.action)) return;
            if (actionBinding.preventDefault) event?.preventDefault?.();
            if (actionBinding.stopPropagation) event?.stopPropagation?.();
            const params = resolveValue(actionBinding.params || {}, { ...context, state: context.store.getSnapshot(), data: context.data || {}, env: context.env || {} });
            const execute = () => {
                if (actionBinding.action === 'state.set' && params.path) context.store.set(params.path, params.value);
                else if (actionBinding.action === 'state.toggle' && params.path) context.store.set(params.path, !context.store.get(params.path));
                else if (actionBinding.action === 'state.increment' && params.path) context.store.set(params.path, Number(context.store.get(params.path) || 0) + Number(params.amount || 1));
                else if (actionBinding.action === 'state.append' && params.path) {
                    const current = context.store.get(params.path);
                    context.store.set(params.path, [...(Array.isArray(current) ? current : []), params.value]);
                } else if (actionBinding.action === 'state.remove' && params.path) context.store.remove(params.path);
                const detail = {
                    intent: actionBinding.action,
                    params,
                    source: 'generative-ui',
                    authority: 'presentation-only',
                    elementKey: context.key,
                };
                if (typeof context.options.actions?.[actionBinding.action] === 'function') context.options.actions[actionBinding.action](detail);
                if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('titan-generative-ui-action', { detail }));
            };
            const prompt = typeof actionBinding.confirm === 'string' ? actionBinding.confirm : 'Continue with this preview action?';
            if (actionBinding.confirm && typeof window !== 'undefined' && !window.confirm(prompt)) return;
            execute();
        });
    }

    function bindEvents(node, specElement, context) {
        Object.entries(specElement.on || {}).forEach(([eventName, binding]) => {
            const safeName = eventName === 'press' ? 'click' : eventName === 'change' ? 'change' : eventName;
            if (!['click', 'change', 'input', 'submit', 'focus', 'blur'].includes(safeName)) return;
            node.addEventListener(safeName, (event) => emitAction(binding, context, event));
        });
    }

    function applyCommonProps(node, props) {
        if (props.id && /^[A-Za-z][A-Za-z0-9_-]*$/.test(String(props.id))) node.id = String(props.id);
        if (props.title) node.title = String(props.title);
        if (props.ariaLabel) node.setAttribute('aria-label', String(props.ariaLabel));
        if (props.hidden === true) node.hidden = true;
        if (props.disabled === true && 'disabled' in node) node.disabled = true;
        if (props.description && !node.getAttribute('aria-description')) node.setAttribute('aria-description', String(props.description));
    }

    function focusableNodes(container) {
        return [...container.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')];
    }

    function openLayer(panel, trigger) {
        panel.hidden = false;
        const nodes = focusableNodes(panel);
        (nodes[0] || panel).focus?.();
        const onKey = (event) => {
            if (event.key === 'Escape') closeLayer(panel, trigger, onKey);
            if (event.key === 'Tab' && nodes.length) {
                const first = nodes[0], last = nodes[nodes.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }
        };
        panel.__tguiKeyHandler = onKey;
        document.addEventListener('keydown', onKey);
    }

    function closeLayer(panel, trigger, handler) {
        panel.hidden = true;
        document.removeEventListener('keydown', handler || panel.__tguiKeyHandler);
        trigger?.focus?.();
    }

    function renderChildren(node, childKeys, context) {
        (childKeys || []).forEach((childKey) => node.appendChild(renderElement(childKey, context)));
    }

    function renderInput(props, tag, context, specElement) {
        const wrapper = element('label', 'tgui-field');
        if (props.label) wrapper.appendChild(element('span', 'tgui-label', props.label));
        const input = element(tag || 'input', 'tgui-input');
        if (tag === 'input') input.type = props.type || 'text';
        if (props.placeholder) input.placeholder = String(props.placeholder);
        if (props.name) input.name = String(props.name);
        const statePath = props.statePath || (isObject(specElement.props?.value) ? specElement.props.value.$state : null);
        let value = statePath ? context.store.get(statePath) : props.value;
        if (input.type === 'checkbox' || input.type === 'radio') input.checked = Boolean(value);
        else input.value = value ?? '';
        const error = element('span', 'tgui-field-error');
        const update = () => {
            const current = input.type === 'checkbox' ? input.checked : input.value;
            if (statePath) context.store.set(statePath, current);
            const errors = validateField(current, props.validation || [], context.store.getSnapshot());
            error.textContent = errors[0] || '';
            input.setAttribute('aria-invalid', errors.length ? 'true' : 'false');
        };
        input.addEventListener(input.type === 'checkbox' ? 'change' : 'input', update);
        wrapper.appendChild(input);
        if (props.hint) wrapper.appendChild(element('span', 'tgui-hint', props.hint));
        wrapper.appendChild(error);
        return wrapper;
    }

    function renderElement(key, context) {
        const specElement = context.spec.elements[key];
        if (!specElement) return element('div', 'tgui-fallback', `Missing element: ${key}`);
        const scoped = { ...context, key };
        if (!evaluateVisibility(specElement.visible, { state: context.store.getSnapshot(), data: context.data || {}, env: context.env || {}, item: context.item, index: context.index })) {
            const hidden = document.createDocumentFragment();
            return hidden;
        }
        if (specElement.repeat && !context.skipRepeat) {
            const values = context.store.get(specElement.repeat.statePath);
            const fragment = document.createDocumentFragment();
            (Array.isArray(values) ? values : []).forEach((item, index) => {
                fragment.appendChild(renderElement(key, { ...context, item, index, skipRepeat: true }));
            });
            return fragment;
        }
        const props = resolveValue(specElement.props || {}, { state: context.store.getSnapshot(), data: context.data || {}, env: context.env || {}, item: context.item, index: context.index });
        const renderer = componentRegistry[specElement.type];
        if (!renderer) return element('div', 'tgui-fallback', `Unsupported component: ${specElement.type}`);
        const node = renderer({ props, element: specElement, context: scoped });
        applyCommonProps(node, props);
        bindEvents(node, specElement, scoped);
        return node;
    }

    function validateSpecClient(input, options) {
        const issues = [];
        if (!isObject(input)) return { valid: false, issues: [{ path: '/', message: 'Spec must be an object.' }] };
        const spec = normaliseSpec(input, options);
        if (input.authority && input.authority !== 'presentation-only') issues.push({ path: '/authority', message: 'Authority must be presentation-only.' });
        if (!spec.root || !isObject(spec.elements)) issues.push({ path: '/', message: 'Spec requires root and elements.' });
        else if (!spec.elements[spec.root]) issues.push({ path: '/root', message: 'Root element is missing.' });
        if (Object.keys(spec.elements || {}).length > 250) issues.push({ path: '/elements', message: 'Too many elements.' });
        const allowed = new Set(options?.components || Object.keys(componentRegistry));
        Object.entries(spec.elements || {}).forEach(([key, entry]) => {
            if (!isObject(entry) || !allowed.has(entry.type)) issues.push({ path: `/elements/${escapePointerToken(key)}/type`, message: `Unknown component: ${entry?.type}` });
            (entry.children || []).forEach((child, index) => {
                if (!spec.elements[child]) issues.push({ path: `/elements/${escapePointerToken(key)}/children/${index}`, message: `Missing child: ${child}` });
            });
        });
        return { valid: issues.length === 0, issues, spec };
    }

    function renderSpec(spec, container, options) {
        if (typeof document === 'undefined') throw new Error('renderSpec requires a browser DOM.');
        if (!container) throw new Error('A render container is required.');
        const config = options || {};
        let currentSpec = normaliseSpec(spec, config);
        const validation = validateSpecClient(currentSpec, config);
        currentSpec = validation.spec || currentSpec;
        container.innerHTML = '';
        if (!validation.valid) {
            const fallback = element('div', 'tgui-error');
            fallback.appendChild(element('strong', '', 'Unable to render generated UI'));
            validation.issues.slice(0, 5).forEach((issue) => fallback.appendChild(element('div', '', issue.message)));
            container.appendChild(fallback);
            return { validation, destroy() {} };
        }
        const persistence = currentSpec.persistence === false ? null : currentSpec.persistence || {};
        const persistenceKey = config.persistenceKey || persistence.key;
        const ownsStore = !config.store;
        const store = config.store || (persistenceKey
            ? createPersistentStateStore(currentSpec.state || {}, { key: persistenceKey, storage: config.storage, historyLimit: persistence.historyLimit || config.historyLimit })
            : createStateStore(currentSpec.state || {}));
        const data = config.data || currentSpec.data || {};
        const env = config.env || {};
        let scheduled = false;
        let watcherScheduled = false;
        let watchReactionCount = 0;
        let watchResetTimer = null;
        let previousSnapshot = clone(store.getSnapshot());
        let destroyed = false;

        const render = () => {
            if (destroyed) return;
            container.innerHTML = '';
            container.classList.add('tgui-root');
            [...container.classList].filter((name) => name.startsWith('tgui-surface-')).forEach((name) => container.classList.remove(name));
            container.classList.add(`tgui-surface-${currentSpec.surface || 'chat'}`);
            container.dataset.authority = 'presentation-only';
            container.dataset.specVersion = currentSpec.version || '1.1';
            container.appendChild(renderElement(currentSpec.root, { spec: currentSpec, store, options: config, data, env, item: undefined, index: undefined, skipRepeat: false }));
            config.onRender?.({ spec: clone(currentSpec), state: clone(store.getSnapshot()), container });
        };

        const runWatchers = () => {
            if (watcherScheduled || destroyed) return;
            watcherScheduled = true;
            queueMicrotask(() => {
                watcherScheduled = false;
                const snapshot = clone(store.getSnapshot());
                Object.entries(currentSpec.elements || {}).forEach(([key, specElement]) => {
                    Object.entries(specElement.watch || {}).forEach(([path, binding]) => {
                        let before; let after;
                        try { before = getByPath(previousSnapshot, path); after = getByPath(snapshot, path); } catch (_) { return; }
                        if (JSON.stringify(before) === JSON.stringify(after)) return;
                        watchReactionCount += 1;
                        if (!watchResetTimer && typeof setTimeout === 'function') watchResetTimer = setTimeout(() => { watchReactionCount = 0; watchResetTimer = null; }, 0);
                        if (watchReactionCount > 24) {
                            config.onRuntimeError?.({ code: 'watch-loop', path, elementKey: key });
                            return;
                        }
                        emitAction(binding, { spec: currentSpec, store, options: config, data, env, key, item: undefined, index: undefined }, null);
                    });
                });
                previousSnapshot = snapshot;
            });
        };

        const unsubscribe = store.subscribe((state) => {
            runWatchers();
            config.onStateChange?.(clone(state));
            if (scheduled) return;
            scheduled = true;
            queueMicrotask(() => { scheduled = false; render(); });
        });
        render();
        return {
            validation,
            store,
            getSpec() { return clone(currentSpec); },
            updateSpec(next, mode = 'replace') {
                currentSpec = normaliseSpec(mode === 'merge' ? deepMerge(currentSpec, next) : mode === 'patch' ? applyJsonPatch(currentSpec, next) : next, config);
                const nextValidation = validateSpecClient(currentSpec, config);
                if (!nextValidation.valid) return nextValidation;
                render();
                config.onSpecChange?.(clone(currentSpec));
                return nextValidation;
            },
            destroy() { destroyed = true; unsubscribe(); if (ownsStore) store.destroy?.(); container.innerHTML = ''; },
            rerender: render,
        };
    }

    function renderMessage(text, container, options) {
        const extracted = extractSpec(text);
        if (!extracted.spec) return extracted;
        renderSpec(extracted.spec, container, options);
        return extracted;
    }

    // Layout and content components.
    registerComponent('text', ({ props }) => element(props.as === 'span' ? 'span' : 'p', `tgui-text tgui-text-${props.tone || 'default'}`, props.text));
    registerComponent('heading', ({ props }) => element(`h${Math.min(6, Math.max(1, Number(props.level || 2)))}`, 'tgui-heading', props.text));
    registerComponent('stack', ({ props, element: specElement, context }) => { const node = element('div', `tgui-stack tgui-gap-${props.gap || 'md'} ${props.align ? `tgui-align-${props.align}` : ''}`); renderChildren(node, specElement.children, context); return node; });
    registerComponent('grid', ({ props, element: specElement, context }) => { const node = element('div', `tgui-grid tgui-grid-${props.columns || 'auto'} tgui-gap-${props.gap || 'md'}`); renderChildren(node, specElement.children, context); return node; });
    registerComponent('card', ({ props, element: specElement, context }) => { const node = element('section', 'tgui-card'); if (props.title) node.appendChild(element('h3', 'tgui-card-title', props.title)); if (props.subtitle) node.appendChild(element('p', 'tgui-card-subtitle', props.subtitle)); renderChildren(node, specElement.children, context); return node; });
    registerComponent('button', ({ props }) => { const node = element(props.href ? 'a' : 'button', `tgui-button tgui-button-${props.variant || 'primary'}`, props.label || 'Continue'); if (props.href) node.href = safeUrl(props.href); else node.type = props.type || 'button'; if (props.disabled) { node.setAttribute('aria-disabled', 'true'); if ('disabled' in node) node.disabled = true; } return node; });
    registerComponent('badge', ({ props }) => element('span', `tgui-badge tgui-badge-${props.tone || 'neutral'}`, props.label || props.text));
    registerComponent('alert', ({ props, element: specElement, context }) => { const node = element('aside', `tgui-alert tgui-alert-${props.tone || 'info'}`); node.setAttribute('role', props.tone === 'danger' ? 'alert' : 'status'); if (props.title) node.appendChild(element('strong', '', props.title)); if (props.message) node.appendChild(element('p', '', props.message)); renderChildren(node, specElement.children, context); return node; });
    registerComponent('separator', ({ props }) => { const node = element('hr', `tgui-separator tgui-separator-${props.orientation || 'horizontal'}`); return node; });
    registerComponent('image', ({ props }) => { const node = element('img', `tgui-image tgui-image-${props.fit || 'cover'}`); node.src = safeUrl(props.src); node.alt = String(props.alt || ''); if (props.loading !== 'eager') node.loading = 'lazy'; return node; });
    registerComponent('progress', ({ props }) => { const node = element('div', 'tgui-progress'); node.setAttribute('role', 'progressbar'); const value = Math.max(0, Math.min(Number(props.max || 100), Number(props.value || 0))); node.setAttribute('aria-valuenow', String(value)); node.setAttribute('aria-valuemin', '0'); node.setAttribute('aria-valuemax', String(props.max || 100)); const bar = element('span', 'tgui-progress-bar'); bar.style.width = `${(value / Number(props.max || 100)) * 100}%`; node.appendChild(bar); return node; });
    registerComponent('spinner', ({ props }) => { const node = element('span', `tgui-spinner tgui-spinner-${props.size || 'md'}`); node.setAttribute('role', 'status'); node.setAttribute('aria-label', props.label || 'Loading'); return node; });
    registerComponent('input', ({ props, element: specElement, context }) => renderInput(props, 'input', context, specElement));
    registerComponent('form-input', ({ props, element: specElement, context }) => renderInput(props, 'input', context, specElement));
    registerComponent('textarea', ({ props, element: specElement, context }) => renderInput(props, 'textarea', context, specElement));
    registerComponent('form-textarea', ({ props, element: specElement, context }) => renderInput(props, 'textarea', context, specElement));
    registerComponent('slider', ({ props, element: specElement, context }) => renderInput({ ...props, type: 'range' }, 'input', context, specElement));
    registerComponent('radio-group', ({ props, context }) => { const group = element('fieldset', 'tgui-radio-group'); if (props.label) group.appendChild(element('legend', 'tgui-label', props.label)); (props.options || []).forEach((option, index) => { const label = element('label', 'tgui-radio-option'); const input = element('input'); input.type = 'radio'; input.name = props.name || `radio-${context.key}`; input.value = option.value; input.checked = context.store.get(props.statePath) === option.value; input.addEventListener('change', () => context.store.set(props.statePath, option.value)); label.append(input, element('span', '', option.label)); group.appendChild(label); }); return group; });
    registerComponent('toggle-group', ({ props, context }) => { const group = element('div', 'tgui-toggle-group'); group.setAttribute('role', 'group'); const current = context.store.get(props.statePath); (props.options || []).forEach((option) => { const button = element('button', `tgui-toggle ${current === option.value ? 'is-active' : ''}`, option.label); button.type = 'button'; button.setAttribute('aria-pressed', current === option.value ? 'true' : 'false'); button.addEventListener('click', () => context.store.set(props.statePath, option.value)); group.appendChild(button); }); return group; });
    registerComponent('metric', ({ props }) => { const node = element('div', 'tgui-metric'); node.appendChild(element('span', 'tgui-metric-label', props.label)); node.appendChild(element('strong', 'tgui-metric-value', props.value)); if (props.change) node.appendChild(element('span', `tgui-metric-change tgui-${props.trend || 'neutral'}`, props.change)); return node; });
    registerComponent('key-value-list', ({ props }) => { const list = element('dl', 'tgui-key-value-list'); (props.items || []).forEach((item) => { const row = element('div', 'tgui-key-value-row'); row.append(element('dt', '', item.label), element('dd', '', item.value)); list.appendChild(row); }); return list; });
    registerComponent('timeline', ({ props }) => { const list = element('ol', 'tgui-timeline'); (props.items || []).forEach((item) => { const row = element('li', 'tgui-timeline-item'); row.append(element('span', `tgui-timeline-dot tgui-${item.tone || 'neutral'}`), element('strong', '', item.title), element('span', '', item.detail || '')); list.appendChild(row); }); return list; });
    registerComponent('collapsible', ({ props, element: specElement, context }) => { const node = element('details', 'tgui-collapsible'); node.open = props.open === true; node.appendChild(element('summary', 'tgui-collapsible-summary', props.label || 'Details')); const body = element('div', 'tgui-collapsible-body'); renderChildren(body, specElement.children, context); node.appendChild(body); return node; });
    registerComponent('popover', ({ props, element: specElement, context }) => { const node = element('div', 'tgui-popover'); const button = element('button', 'tgui-button tgui-button-secondary', props.label || 'Open'); button.type = 'button'; button.setAttribute('aria-expanded', 'false'); const panel = element('div', 'tgui-popover-panel'); panel.hidden = true; panel.tabIndex = -1; renderChildren(panel, specElement.children, context); button.addEventListener('click', () => { if (panel.hidden) { openLayer(panel, button); button.setAttribute('aria-expanded', 'true'); } else { closeLayer(panel, button); button.setAttribute('aria-expanded', 'false'); } }); node.append(button, panel); return node; });
    registerComponent('sheet', ({ props, element: specElement, context }) => { const node = element('div', 'tgui-sheet'); const button = element('button', 'tgui-button tgui-button-secondary', props.label || 'Open panel'); button.type = 'button'; const panel = element('aside', `tgui-sheet-panel tgui-sheet-${props.side || 'right'}`); panel.hidden = true; panel.tabIndex = -1; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); const close = element('button', 'tgui-sheet-close', '×'); close.setAttribute('aria-label', 'Close panel'); close.addEventListener('click', () => closeLayer(panel, button)); panel.appendChild(close); renderChildren(panel, specElement.children, context); button.addEventListener('click', () => openLayer(panel, button)); node.append(button, panel); return node; });
    registerComponent('carousel', ({ props }) => { const node = element('div', 'tgui-carousel'); const track = element('div', 'tgui-carousel-track'); let active = 0; const items = props.items || []; const paint = () => { track.innerHTML = ''; const item = items[active]; if (item) { const card = element('article', 'tgui-carousel-item'); if (item.image) { const image = element('img', 'tgui-image'); image.src = safeUrl(item.image); image.alt = item.alt || ''; card.appendChild(image); } card.appendChild(element('strong', '', item.title || '')); if (item.description) card.appendChild(element('p', '', item.description)); track.appendChild(card); } }; const controls = element('div', 'tgui-carousel-controls'); const previous = element('button', 'tgui-button tgui-button-secondary', 'Previous'); const next = element('button', 'tgui-button tgui-button-secondary', 'Next'); previous.addEventListener('click', () => { active = (active - 1 + items.length) % Math.max(1, items.length); paint(); }); next.addEventListener('click', () => { active = (active + 1) % Math.max(1, items.length); paint(); }); controls.append(previous, next); node.append(track, controls); paint(); return node; });
    registerComponent('pagination', ({ props, context }) => { const node = element('nav', 'tgui-pagination'); node.setAttribute('aria-label', 'Pagination'); const current = Number(context.store.get(props.statePath) || props.current || 1); const total = Math.max(1, Number(props.total || 1)); for (let page = 1; page <= Math.min(total, 20); page += 1) { const button = element('button', `tgui-page ${page === current ? 'is-active' : ''}`, page); button.type = 'button'; button.setAttribute('aria-current', page === current ? 'page' : 'false'); button.addEventListener('click', () => context.store.set(props.statePath, page)); node.appendChild(button); } return node; });
    registerComponent('resizable-panels', ({ props, element: specElement, context }) => { const node = element('div', 'tgui-resizable'); const keys = specElement.children || []; keys.forEach((childKey, index) => { const panel = element('div', 'tgui-resizable-panel'); panel.style.flexBasis = `${props.sizes?.[index] || 50}%`; panel.appendChild(renderElement(childKey, context)); node.appendChild(panel); if (index < keys.length - 1) { const handle = element('div', 'tgui-resize-handle'); let startX; let startWidth; handle.addEventListener('pointerdown', (event) => { startX = event.clientX; startWidth = panel.getBoundingClientRect().width; handle.setPointerCapture(event.pointerId); }); handle.addEventListener('pointermove', (event) => { if (startX === undefined) return; panel.style.flexBasis = `${Math.max(180, startWidth + event.clientX - startX)}px`; }); handle.addEventListener('pointerup', () => { startX = undefined; }); node.appendChild(handle); } }); return node; });

    // Extended catalogue renderers adapted from json-render's catalogue-driven model.
    registerComponent('avatar', ({ props }) => {
        const node = element('span', `tgui-avatar tgui-avatar-${props.size || 'md'}`);
        if (props.src) {
            const image = element('img'); image.src = safeUrl(props.src); image.alt = String(props.alt || props.name || ''); node.appendChild(image);
        } else {
            const initials = String(props.initials || props.name || '?').split(/\s+/).map((part) => part[0] || '').join('').slice(0, 2).toUpperCase();
            node.textContent = initials;
        }
        return node;
    });
    registerComponent('form-select', ({ props, element: specElement, context }) => {
        const wrapper = element('label', 'tgui-field');
        if (props.label) wrapper.appendChild(element('span', 'tgui-label', props.label));
        const select = element('select', 'tgui-input');
        const statePath = props.statePath || (isObject(specElement.props?.value) ? specElement.props.value.$state : null);
        (props.options || []).forEach((option) => {
            const optionNode = element('option', '', option.label ?? option.value); optionNode.value = String(option.value ?? ''); select.appendChild(optionNode);
        });
        select.value = String(statePath ? context.store.get(statePath) ?? '' : props.value ?? '');
        select.addEventListener('change', () => { if (statePath) context.store.set(statePath, select.value); });
        wrapper.appendChild(select); return wrapper;
    });
    registerComponent('form-checkbox', ({ props, element: specElement, context }) => {
        const label = element('label', 'tgui-check'); const input = element('input'); input.type = 'checkbox';
        const statePath = props.statePath || (isObject(specElement.props?.checked) ? specElement.props.checked.$state : null);
        input.checked = Boolean(statePath ? context.store.get(statePath) : props.checked);
        input.addEventListener('change', () => { if (statePath) context.store.set(statePath, input.checked); });
        label.append(input, element('span', '', props.label || '')); return label;
    });
    registerComponent('form-toggle', ({ props, element: specElement, context }) => {
        const statePath = props.statePath || (isObject(specElement.props?.checked) ? specElement.props.checked.$state : null);
        const checked = Boolean(statePath ? context.store.get(statePath) : props.checked);
        const button = element('button', `tgui-switch ${checked ? 'is-active' : ''}`); button.type = 'button'; button.setAttribute('role', 'switch'); button.setAttribute('aria-checked', checked ? 'true' : 'false');
        button.append(element('span', 'tgui-switch-knob'), element('span', 'tgui-switch-label', props.label || 'Toggle'));
        button.addEventListener('click', () => { if (statePath) context.store.set(statePath, !checked); }); return button;
    });
    registerComponent('table', ({ props }) => {
        const wrapper = element('div', 'tgui-table-wrap'); const table = element('table', 'tgui-table');
        const columns = props.columns || []; const rows = props.rows || props.items || [];
        if (props.caption) table.appendChild(element('caption', '', props.caption));
        const head = element('thead'); const headRow = element('tr'); columns.forEach((column) => headRow.appendChild(element('th', '', column.label || column.key))); head.appendChild(headRow); table.appendChild(head);
        const body = element('tbody'); rows.forEach((row) => { const tr = element('tr'); columns.forEach((column) => { const value = row?.[column.key]; tr.appendChild(element('td', '', value === null || value === undefined ? '' : value)); }); body.appendChild(tr); }); table.appendChild(body); wrapper.appendChild(table); return wrapper;
    });
    registerComponent('tabs', ({ props, element: specElement, context }) => {
        const node = element('div', 'tgui-tabs'); const list = element('div', 'tgui-tab-list'); list.setAttribute('role', 'tablist');
        const tabs = props.tabs || []; const statePath = props.statePath; const current = statePath ? context.store.get(statePath) : (props.active || tabs[0]?.value);
        tabs.forEach((tab) => { const button = element('button', `tgui-tab ${current === tab.value ? 'is-active' : ''}`, tab.label); button.type = 'button'; button.setAttribute('role', 'tab'); button.setAttribute('aria-selected', current === tab.value ? 'true' : 'false'); button.addEventListener('click', () => { if (statePath) context.store.set(statePath, tab.value); }); list.appendChild(button); });
        node.appendChild(list); const panel = element('div', 'tgui-tab-panel'); renderChildren(panel, specElement.children, context); node.appendChild(panel); return node;
    });
    registerComponent('tooltip', ({ props, element: specElement, context }) => { const node = element('span', 'tgui-tooltip'); node.title = String(props.text || props.label || ''); renderChildren(node, specElement.children, context); if (!node.childNodes.length) node.appendChild(element('span', '', props.label || 'Info')); return node; });
    registerComponent('dropdown', ({ props, element: specElement, context }) => { const node = element('details', 'tgui-dropdown'); node.appendChild(element('summary', 'tgui-button tgui-button-secondary', props.label || 'Menu')); const menu = element('div', 'tgui-dropdown-menu'); renderChildren(menu, specElement.children, context); (props.items || []).forEach((item) => menu.appendChild(element('button', 'tgui-dropdown-item', item.label))); node.appendChild(menu); return node; });
    registerComponent('modal', ({ props, element: specElement, context }) => { const node = element('div', 'tgui-modal-launcher'); const button = element('button', 'tgui-button tgui-button-secondary', props.label || 'Open dialog'); button.type = 'button'; const overlay = element('div', 'tgui-modal-overlay'); overlay.hidden = true; overlay.tabIndex = -1; const dialog = element('section', 'tgui-modal'); dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true'); if (props.title) dialog.appendChild(element('h3', 'tgui-heading', props.title)); renderChildren(dialog, specElement.children, context); const close = element('button', 'tgui-button tgui-button-secondary', 'Close'); close.addEventListener('click', () => closeLayer(overlay, button)); dialog.appendChild(close); overlay.appendChild(dialog); overlay.addEventListener('click', event => { if (event.target === overlay) closeLayer(overlay, button); }); button.addEventListener('click', () => openLayer(overlay, button)); node.append(button, overlay); return node; });
    registerComponent('drawer', componentRegistry.sheet);
    registerComponent('confirm-dialog', ({ props, element: specElement, context }) => { const node = element('div', 'tgui-confirm'); if (props.title) node.appendChild(element('strong', '', props.title)); if (props.message) node.appendChild(element('p', '', props.message)); const button = element('button', 'tgui-button tgui-button-primary', props.confirmLabel || 'Confirm'); node.appendChild(button); return node; });
    registerComponent('toast', ({ props }) => { const node = element('div', `tgui-toast tgui-toast-${props.tone || 'info'}`); node.setAttribute('role', props.tone === 'danger' ? 'alert' : 'status'); if (props.title) node.appendChild(element('strong', '', props.title)); if (props.message) node.appendChild(element('span', '', props.message)); return node; });
    registerComponent('page-header', ({ props, element: specElement, context }) => { const node = element('header', 'tgui-page-header'); const copy = element('div'); copy.appendChild(element('h2', 'tgui-heading', props.title || '')); if (props.description) copy.appendChild(element('p', 'tgui-text tgui-text-muted', props.description)); node.appendChild(copy); const actions = element('div', 'tgui-page-actions'); renderChildren(actions, specElement.children, context); node.appendChild(actions); return node; });
    registerComponent('report-shell', ({ props, element: specElement, context }) => { const node = element('section', 'tgui-report'); if (props.title) node.appendChild(element('h2', 'tgui-heading', props.title)); if (props.period) node.appendChild(element('p', 'tgui-text tgui-text-muted', props.period)); renderChildren(node, specElement.children, context); return node; });
    registerComponent('save-bar', ({ props, element: specElement, context }) => { const node = element('div', 'tgui-save-bar'); node.appendChild(element('span', '', props.message || 'Preview changes')); renderChildren(node, specElement.children, context); return node; });
    registerComponent('settings-layout', ({ props, element: specElement, context }) => { const node = element('section', 'tgui-settings'); if (props.title) node.appendChild(element('h2', 'tgui-heading', props.title)); renderChildren(node, specElement.children, context); return node; });
    registerComponent('permission-selector', ({ props, context }) => { const node = element('fieldset', 'tgui-permissions'); if (props.label) node.appendChild(element('legend', 'tgui-label', props.label)); const statePath = props.statePath; const selected = new Set(context.store.get(statePath) || props.selected || []); (props.options || []).forEach((option) => { const label = element('label', 'tgui-check'); const input = element('input'); input.type = 'checkbox'; input.checked = selected.has(option.value); input.addEventListener('change', () => { if (!statePath) return; const next = new Set(context.store.get(statePath) || []); input.checked ? next.add(option.value) : next.delete(option.value); context.store.set(statePath, [...next]); }); label.append(input, element('span', '', option.label)); node.appendChild(label); }); return node; });
    registerComponent('nav-item', ({ props }) => { const node = element(props.href ? 'a' : 'button', 'tgui-nav-item', props.label || props.text); if (props.href) node.href = safeUrl(props.href); else node.type = 'button'; return node; });
    registerComponent('nav-group', ({ props, element: specElement, context }) => { const node = element('section', 'tgui-nav-group'); if (props.label) node.appendChild(element('strong', 'tgui-nav-label', props.label)); renderChildren(node, specElement.children, context); return node; });
    registerComponent('nav-menu', ({ props, element: specElement, context }) => { const node = element('nav', 'tgui-nav-menu'); node.setAttribute('aria-label', props.label || 'Navigation'); renderChildren(node, specElement.children, context); return node; });
    registerComponent('command-palette', ({ props }) => { const node = element('div', 'tgui-command-palette'); const search = element('input', 'tgui-input'); search.placeholder = props.placeholder || 'Search commands'; const list = element('div', 'tgui-command-list'); const items = props.items || []; const paint = () => { const term = search.value.toLowerCase(); list.innerHTML = ''; items.filter((item) => String(item.label || '').toLowerCase().includes(term)).forEach((item) => list.appendChild(element('button', 'tgui-command-item', item.label))); }; search.addEventListener('input', paint); node.append(search, list); paint(); return node; });
    registerComponent('theme-customizer', ({ props, context }) => { const node = element('div', 'tgui-theme-customizer'); const statePath = props.statePath || '/theme'; (props.themes || []).forEach((theme) => { const button = element('button', 'tgui-theme-option', theme.label || theme.value); button.type = 'button'; button.addEventListener('click', () => context.store.set(statePath, theme.value)); node.appendChild(button); }); return node; });

    registerComponent('action-bar', ({ props, element: specElement, context }) => { const node = element('div', `tgui-action-bar tgui-action-bar-${props.align || 'end'}`); renderChildren(node, specElement.children, context); return node; });
    registerComponent('approval-card', ({ props, element: specElement, context }) => { const node = element('article', `tgui-approval-card tgui-${props.tone || 'warning'}`); const head = element('div', 'tgui-approval-head'); head.append(element('span', 'tgui-approval-icon', props.icon || '✓'), element('strong', '', props.title || 'Approval required')); node.appendChild(head); if (props.summary) node.appendChild(element('p', '', props.summary)); if (props.impact) node.appendChild(element('div', 'tgui-approval-impact', props.impact)); renderChildren(node, specElement.children, context); return node; });
    registerComponent('briefing', ({ props, element: specElement, context }) => { const node = element('section', 'tgui-briefing'); node.appendChild(element('span', 'tgui-briefing-kicker', props.kicker || 'Titan briefing')); node.appendChild(element('h3', 'tgui-heading', props.title || '')); if (props.summary) node.appendChild(element('p', 'tgui-text', props.summary)); renderChildren(node, specElement.children, context); return node; });
    registerComponent('calendar-agenda', ({ props }) => { const node = element('div', 'tgui-agenda'); (props.items || []).forEach((item) => { const row = element('article', 'tgui-agenda-item'); const time = element('time', 'tgui-agenda-time', item.time || ''); row.append(time, element('strong', '', item.title || 'Event')); if (item.detail) row.appendChild(element('span', 'tgui-text-muted', item.detail)); node.appendChild(row); }); return node; });
    registerComponent('data-list', ({ props }) => { const list = element('ul', 'tgui-data-list'); (props.items || []).forEach((item) => { const row = element('li', 'tgui-data-list-item'); const copy = element('div'); copy.appendChild(element('strong', '', item.title || item.label || '')); if (item.description || item.detail) copy.appendChild(element('span', 'tgui-text-muted', item.description || item.detail)); row.appendChild(copy); if (item.value !== undefined) row.appendChild(element('span', 'tgui-data-list-value', item.value)); list.appendChild(row); }); return list; });
    registerComponent('entity-card', ({ props, element: specElement, context }) => { const node = element('article', 'tgui-entity-card'); const head = element('div', 'tgui-entity-head'); if (props.avatar || props.initials) head.appendChild(componentRegistry.avatar({ props: { src: props.avatar, initials: props.initials, name: props.title, size: 'md' } })); const copy = element('div'); copy.appendChild(element('strong', '', props.title || 'Record')); if (props.subtitle) copy.appendChild(element('span', 'tgui-text-muted', props.subtitle)); head.appendChild(copy); if (props.status) head.appendChild(element('span', `tgui-badge tgui-badge-${props.tone || 'neutral'}`, props.status)); node.appendChild(head); renderChildren(node, specElement.children, context); return node; });
    registerComponent('filter-bar', ({ props, element: specElement, context }) => { const node = element('div', 'tgui-filter-bar'); if (props.title) node.appendChild(element('strong', '', props.title)); renderChildren(node, specElement.children, context); return node; });
    registerComponent('form-section', ({ props, element: specElement, context }) => { const node = element('fieldset', 'tgui-form-section'); if (props.title) node.appendChild(element('legend', 'tgui-form-section-title', props.title)); if (props.description) node.appendChild(element('p', 'tgui-text-muted', props.description)); renderChildren(node, specElement.children, context); return node; });
    registerComponent('kanban-board', ({ props }) => { const board = element('div', 'tgui-kanban'); (props.columns || []).forEach((column) => { const lane = element('section', 'tgui-kanban-column'); const heading = element('div', 'tgui-kanban-heading'); heading.append(element('strong', '', column.label || column.title || 'Column'), element('span', 'tgui-badge tgui-badge-neutral', (column.items || []).length)); lane.appendChild(heading); (column.items || []).forEach((item) => { const card = element('article', 'tgui-kanban-card'); card.appendChild(element('strong', '', item.title || 'Item')); if (item.detail) card.appendChild(element('span', 'tgui-text-muted', item.detail)); lane.appendChild(card); }); board.appendChild(lane); }); return board; });
    registerComponent('number-stepper', ({ props, context }) => { const node = element('div', 'tgui-stepper'); const path = props.statePath; const value = Number(path ? context.store.get(path) : props.value || 0); const min = Number(props.min ?? 0); const max = Number(props.max ?? Number.MAX_SAFE_INTEGER); const step = Number(props.step || 1); const minus = element('button', 'tgui-stepper-button', '−'); const output = element('output', 'tgui-stepper-value', value); const plus = element('button', 'tgui-stepper-button', '+'); minus.type = plus.type = 'button'; minus.addEventListener('click', () => path && context.store.set(path, Math.max(min, value - step))); plus.addEventListener('click', () => path && context.store.set(path, Math.min(max, value + step))); node.append(minus, output, plus); return node; });
    registerComponent('segmented-control', ({ props, context }) => componentRegistry['toggle-group']({ props, context }));
    registerComponent('summary-banner', ({ props, element: specElement, context }) => { const node = element('section', `tgui-summary-banner tgui-summary-${props.tone || 'info'}`); if (props.eyebrow) node.appendChild(element('span', 'tgui-briefing-kicker', props.eyebrow)); node.appendChild(element('h3', 'tgui-heading', props.title || '')); if (props.description) node.appendChild(element('p', '', props.description)); renderChildren(node, specElement.children, context); return node; });


    // Titan Builder Premium Mobile UI — Mobilekit v2.9.1 extraction.
    // All renderers use textContent/DOM APIs; no raw HTML interpolation is permitted.
    registerComponent('mobile-app-shell', ({ props, element: specElement, context }) => {
        const node = element('section', `tpm-app-shell ${props.safeArea === false ? '' : 'tpm-safe'}`);
        const content = element('main', 'tpm-app-content');
        const headers = [], footers = [], floats = [], body = [];
        (specElement.children || []).forEach((childKey) => {
            const childType = context.spec.elements?.[childKey]?.type;
            if (['mobile-app-header', 'mobile-tab-header'].includes(childType)) headers.push(childKey);
            else if (childType === 'mobile-bottom-nav') footers.push(childKey);
            else if (childType === 'floating-action-button') floats.push(childKey);
            else body.push(childKey);
        });
        headers.forEach((childKey) => node.appendChild(renderElement(childKey, context)));
        body.forEach((childKey) => content.appendChild(renderElement(childKey, context)));
        node.appendChild(content);
        floats.forEach((childKey) => node.appendChild(renderElement(childKey, context)));
        footers.forEach((childKey) => node.appendChild(renderElement(childKey, context)));
        return node;
    });
    registerComponent('mobile-app-header', ({ props }) => {
        const tone = ['primary', 'transparent'].includes(props.tone) ? `tpm-${props.tone}` : '';
        const node = element('header', `tpm-app-header ${tone} ${props.sticky === false ? '' : 'tpm-sticky'} ${props.transparent ? 'tpm-transparent' : ''}`);
        const left = element('button', 'tpm-header-action', props.leftLabel || '‹'); left.type = 'button';
        const copy = element('div', 'tpm-header-copy'); copy.appendChild(element('strong', 'tpm-header-title', props.title || ''));
        if (props.subtitle) copy.appendChild(element('span', 'tpm-header-subtitle', props.subtitle));
        const right = element('button', 'tpm-header-action', props.rightLabel || ''); right.type = 'button';
        if (!props.leftLabel && props.showBack === false) left.setAttribute('aria-hidden', 'true');
        node.append(left, copy, right); return node;
    });
    registerComponent('mobile-tab-header', ({ props }) => {
        const node = element('nav', 'tpm-tab-header'); node.setAttribute('aria-label', props.ariaLabel || 'Sections');
        (props.tabs || []).forEach((tab, index) => {
            const data = isObject(tab) ? tab : { label: tab };
            const button = element('button', `tpm-tab ${(data.value ?? index) === props.active || data.label === props.active ? 'is-active' : ''}`, data.label || String(data.value ?? 'Tab'));
            button.type = 'button'; node.appendChild(button);
        });
        return node;
    });
    registerComponent('mobile-bottom-nav', ({ props }) => {
        const node = element('nav', 'tpm-bottom-nav'); node.setAttribute('aria-label', props.ariaLabel || 'Primary mobile navigation');
        (props.items || []).slice(0, 6).forEach((item, index) => {
            const data = isObject(item) ? item : { label: item };
            const active = data.id === props.active || data.value === props.active || index === props.active;
            const button = element('button', `tpm-bottom-nav-item ${active ? 'is-active' : ''}`); button.type = 'button';
            button.appendChild(element('span', 'tpm-bottom-nav-icon', data.icon || '•'));
            if (props.labels !== false) button.appendChild(element('span', 'tpm-bottom-nav-label', data.label || data.id || `Item ${index + 1}`));
            if (data.badge !== undefined && data.badge !== null && data.badge !== '') button.appendChild(element('span', 'tpm-bottom-nav-badge', data.badge));
            node.appendChild(button);
        });
        return node;
    });
    registerComponent('floating-action-button', ({ props }) => {
        const node = element('button', `tpm-fab tpm-fab-${props.position || 'right'} ${props.extended === false ? 'tpm-fab-icon-only' : ''}`); node.type = 'button';
        if (props.icon) node.appendChild(element('span', '', props.icon));
        if (props.extended !== false && props.label) node.appendChild(element('span', '', props.label));
        node.setAttribute('aria-label', props.ariaLabel || props.label || 'Action'); return node;
    });
    registerComponent('action-sheet', ({ props, element: specElement, context }) => {
        const launcher = element('div', 'tpm-action-sheet-launcher');
        const trigger = element('button', 'tgui-button tgui-button-secondary', props.label || 'Open actions'); trigger.type = 'button';
        const backdrop = element('div', 'tpm-action-sheet-backdrop'); backdrop.hidden = true; backdrop.tabIndex = -1;
        const sheet = element('section', 'tpm-action-sheet'); sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true');
        const head = element('div', 'tpm-action-sheet-head'); if (props.title) head.appendChild(element('strong', '', props.title)); if (props.description) head.appendChild(element('span', 'tgui-text-muted', props.description)); sheet.appendChild(head);
        const body = element('div', 'tpm-action-sheet-body'); renderChildren(body, specElement.children, context); sheet.appendChild(body);
        const close = element('button', 'tpm-action-sheet-close', props.dismissLabel || 'Close'); close.type = 'button'; close.addEventListener('click', () => closeLayer(backdrop, trigger)); sheet.appendChild(close);
        backdrop.appendChild(sheet); backdrop.addEventListener('click', event => { if (event.target === backdrop) closeLayer(backdrop, trigger); }); trigger.addEventListener('click', () => openLayer(backdrop, trigger)); launcher.append(trigger, backdrop); return launcher;
    });
    registerComponent('mobile-list', ({ props }) => {
        const list = element('ul', `tpm-list ${props.inset ? 'tpm-inset' : ''}`);
        (props.items || []).forEach((item) => {
            const data = isObject(item) ? item : { title: item }; const row = element('li', 'tpm-list-item');
            if (data.image) { const img = element('img', 'tpm-list-media'); img.src = safeUrl(data.image); img.alt = String(data.imageAlt || ''); row.appendChild(img); }
            const copy = element('div', 'tpm-list-copy'); copy.appendChild(element('span', 'tpm-list-title', data.title || data.label || '')); if (data.detail || data.description) copy.appendChild(element('span', 'tpm-list-detail', data.detail || data.description)); row.appendChild(copy);
            if (data.value !== undefined) row.appendChild(element('span', 'tpm-list-value', data.value)); list.appendChild(row);
        }); return list;
    });
    registerComponent('nested-list', ({ props }) => {
        const maxDepth = Math.max(1, Math.min(4, Number(props.maxDepth || 3)));
        const build = (items, depth) => { const list = element('ul', 'tpm-nested-list'); (items || []).forEach((item) => { const data = isObject(item) ? item : { label: item }; const li = element('li'); li.appendChild(element('span', 'tpm-nested-list-item', data.label || data.title || '')); if (depth < maxDepth && Array.isArray(data.children)) li.appendChild(build(data.children, depth + 1)); list.appendChild(li); }); return list; };
        return build(props.items || [], 1);
    });
    registerComponent('sticky-list', ({ props }) => {
        const node = element('div', 'tpm-sticky-list'); (props.sections || []).forEach((section) => { const data = isObject(section) ? section : { title: section }; const group = element('section', 'tpm-sticky-section'); group.appendChild(element('h4', 'tpm-sticky-title', data.title || data.label || '')); const list = componentRegistry['mobile-list']({ props: { items: data.items || [], inset: props.inset } }); group.appendChild(list); node.appendChild(group); }); return node;
    });
    registerComponent('story-strip', ({ props }) => {
        const node = element('div', 'tpm-story-strip'); node.setAttribute('role', 'list');
        (props.items || []).forEach((item, index) => { const data = isObject(item) ? item : { label: item }; const story = element('button', 'tpm-story'); story.type = 'button'; story.setAttribute('role', 'listitem'); const ring = element('span', 'tpm-story-ring'); if (data.image) { const img = element('img'); img.src = safeUrl(data.image); img.alt = String(data.label || 'Story'); ring.appendChild(img); } else ring.appendChild(element('span', '', data.initials || String(data.label || index + 1).slice(0, 2).toUpperCase())); story.appendChild(ring); if (props.showLabels !== false) story.appendChild(element('span', 'tpm-story-label', data.label || `Story ${index + 1}`)); node.appendChild(story); }); return node;
    });
    registerComponent('form-wizard', ({ props, element: specElement, context }) => {
        const steps = Array.isArray(props.steps) && props.steps.length ? props.steps : [{ title: 'Step 1' }]; const path = props.statePath || '/wizardStep'; let index = Math.max(0, Math.min(steps.length - 1, Number(context.store.get(path) ?? 0))); const current = isObject(steps[index]) ? steps[index] : { title: steps[index] };
        const node = element('section', 'tpm-form-wizard');
        if (props.showProgress !== false) { const progress = element('div', 'tpm-wizard-progress'); steps.forEach((_, i) => progress.appendChild(element('span', i <= index ? 'is-active' : ''))); node.appendChild(progress); }
        const head = element('div', 'tpm-wizard-head'); head.appendChild(element('span', 'tpm-wizard-index', `Step ${index + 1} of ${steps.length}`)); head.appendChild(element('strong', '', current.title || current.label || `Step ${index + 1}`)); if (current.description) head.appendChild(element('span', 'tgui-text-muted', current.description)); node.appendChild(head);
        const body = element('div', 'tpm-wizard-body'); renderChildren(body, specElement.children, context); node.appendChild(body);
        const actions = element('div', 'tpm-wizard-actions'); const back = element('button', 'tpm-wizard-button', props.backLabel || 'Back'); const next = element('button', 'tpm-wizard-button tpm-primary-button', index === steps.length - 1 ? (props.finishLabel || 'Finish') : (props.nextLabel || 'Next')); back.type = next.type = 'button'; back.disabled = index === 0; back.addEventListener('click', () => context.store.set(path, Math.max(0, index - 1))); next.addEventListener('click', () => context.store.set(path, Math.min(steps.length - 1, index + 1))); actions.append(back, next); node.appendChild(actions); return node;
    });
    registerComponent('mobile-input', ({ props, element: specElement, context }) => {
        const node = element('div', `tpm-mobile-input tpm-${props.style || 'boxed'}`); node.appendChild(renderInput(props, props.multiline ? 'textarea' : 'input', context, specElement)); return node;
    });
    registerComponent('chip', ({ props }) => {
        const tone = ['primary','success','danger','warning'].includes(props.tone) ? `tpm-chip-${props.tone}` : ''; const node = element('span', `tpm-chip ${tone} ${props.outline ? 'tpm-outline' : ''}`);
        if (props.avatar) { const img = element('img', 'tpm-chip-avatar'); img.src = safeUrl(props.avatar); img.alt = ''; node.appendChild(img); } node.appendChild(element('span', '', props.label || 'Chip')); if (props.dismissible) node.appendChild(element('span', '', '×')); return node;
    });
    registerComponent('comment-thread', ({ props }) => {
        const node = element('section', 'tpm-comment-thread'); (props.items || []).forEach((item) => { const data = isObject(item) ? item : { text: item }; const row = element('article', 'tpm-comment'); row.appendChild(element('div', 'tpm-comment-avatar', data.initials || String(data.author || '?').slice(0, 2).toUpperCase())); const body = element('div', 'tpm-comment-body'); const head = element('div', 'tpm-comment-head'); head.append(element('strong', '', data.author || 'Comment'), element('time', 'tpm-comment-time', data.time || '')); body.append(head, element('div', 'tpm-comment-text', data.text || data.message || '')); if (props.showActions !== false) { const actions = element('div', 'tpm-comment-actions'); actions.append(element('span', '', 'Reply'), element('span', '', 'Like')); body.appendChild(actions); } row.appendChild(body); node.appendChild(row); }); return node;
    });
    registerComponent('network-status', ({ props }) => {
        const online = props.online !== false; const node = element('div', 'tpm-network-status'); node.dataset.online = online ? 'true' : 'false'; node.dataset.tpmNetworkStatus = ''; node.setAttribute('role', 'status'); node.append(element('span', 'tpm-network-dot'), element('span', '', online ? (props.onlineLabel || 'Online') : (props.offlineLabel || 'Offline'))); return node;
    });
    registerComponent('install-prompt', ({ props }) => {
        const node = element('aside', 'tpm-install-prompt'); if (props.visible === false) node.hidden = true; node.appendChild(element('div', 'tpm-install-icon', props.icon || 'T')); const copy = element('div', 'tpm-install-copy'); copy.appendChild(element('strong', '', props.title || 'Install this app')); if (props.description) copy.appendChild(element('span', 'tgui-text-muted', props.description)); copy.appendChild(element('span', 'tpm-install-platform', props.platform || 'PWA preview')); node.appendChild(copy); node.appendChild(element('span', '', props.hint || 'Add to Home Screen')); return node;
    });
    registerComponent('upload-preview', ({ props, context }) => {
        const node = element('div', 'tpm-upload-preview'); const input = element('input'); input.type = 'file'; input.accept = String(props.accept || 'image/*'); const id = `tpm-upload-${Math.random().toString(36).slice(2)}`; input.id = id;
        const label = element('label', 'tpm-upload-label'); label.setAttribute('for', id); const copy = element('span', 'tpm-upload-copy'); copy.appendChild(element('strong', '', props.label || 'Choose an image')); copy.appendChild(element('small', '', props.hint || 'Preview only — upload remains host controlled')); label.appendChild(copy); node.append(input, label);
        input.addEventListener('change', () => { const file = input.files?.[0]; if (!file || !String(file.type || '').startsWith('image/')) return; const path = props.statePath; if (path) context.store.set(path, { name: file.name, type: file.type, size: file.size, previewOnly: true }); if (typeof URL !== 'undefined' && URL.createObjectURL) { const image = element('img', 'tpm-upload-image'); image.alt = String(props.label || 'Selected preview'); const url = URL.createObjectURL(file); image.src = url; image.addEventListener('load', () => URL.revokeObjectURL?.(url), { once: true }); label.textContent = ''; label.appendChild(image); } }); return node;
    });


    // Premium Mobilekit v0.6 interaction pack. Presentation only; state stays in the local spec store.
    registerComponent('mobile-checkbox', ({ props, context }) => {
        const row = element('label', 'tpm-check-row'); const input = element('input'); input.type = 'checkbox'; input.name = String(props.name || '');
        const current = props.statePath ? context.store.get(props.statePath) : props.checked; input.checked = current === true; input.disabled = props.disabled === true;
        const control = element('span', 'tpm-check-control', input.checked ? '✓' : ''); const copy = element('span', '', props.label || 'Option'); row.dataset.checked = input.checked ? 'true' : 'false';
        input.addEventListener('change', () => { row.dataset.checked = input.checked ? 'true' : 'false'; control.textContent = input.checked ? '✓' : ''; if (props.statePath) context.store.set(props.statePath, input.checked); });
        row.append(input, control, copy); return row;
    });
    registerComponent('mobile-radio', ({ props, context }) => {
        const row = element('label', 'tpm-radio-row'); const input = element('input'); input.type = 'radio'; input.name = String(props.name || 'mobile-radio'); input.value = String(props.value ?? '');
        const current = props.statePath ? context.store.get(props.statePath) : props.selected; input.checked = current === props.value || current === true; input.disabled = props.disabled === true;
        row.dataset.checked = input.checked ? 'true' : 'false'; const control = element('span', 'tpm-radio-control');
        input.addEventListener('change', () => { if (!input.checked) return; row.dataset.checked = 'true'; if (props.statePath) context.store.set(props.statePath, props.value); });
        row.append(input, control, element('span', '', props.label || 'Option')); return row;
    });
    registerComponent('mobile-toggle', ({ props, context }) => {
        const row = element('label', 'tpm-toggle-row'); const input = element('input'); input.type = 'checkbox'; input.name = String(props.name || '');
        input.checked = (props.statePath ? context.store.get(props.statePath) : props.checked) === true; input.disabled = props.disabled === true; row.dataset.checked = input.checked ? 'true' : 'false';
        const copy = element('span', '', props.label || 'Toggle'); copy.style.flex = '1'; const control = element('span', 'tpm-toggle');
        input.addEventListener('change', () => { row.dataset.checked = input.checked ? 'true' : 'false'; if (props.statePath) context.store.set(props.statePath, input.checked); }); row.append(input, copy, control); return row;
    });
    registerComponent('mobile-stepper', ({ props, context }) => {
        const node = element('div', 'tpm-stepper'); const path = props.statePath; let value = Number(path ? context.store.get(path) : props.value || 0); const min = Number(props.min ?? 0); const max = Number(props.max ?? Number.MAX_SAFE_INTEGER); const step = Number(props.step || 1);
        const minus = element('button', '', '−'); const output = element('output', '', value); const plus = element('button', '', '+'); minus.type = plus.type = 'button';
        const commit = (next) => { value = Math.max(min, Math.min(max, next)); output.textContent = String(value); if (path) context.store.set(path, value); };
        minus.addEventListener('click', () => commit(value - step)); plus.addEventListener('click', () => commit(value + step)); node.append(minus, output, plus); return node;
    });
    registerComponent('mobile-search', ({ props, context }) => {
        const node = element('div', 'tpm-search'); const input = element('input'); input.type = 'search'; input.name = String(props.name || 'search'); input.placeholder = String(props.placeholder || 'Search'); input.value = String(props.statePath ? context.store.get(props.statePath) ?? props.value ?? '' : props.value ?? '');
        const icon = element('span', 'tpm-search-icon', '⌕'); node.append(icon, input); if (props.statePath) input.addEventListener('input', () => context.store.set(props.statePath, input.value));
        if (props.showClear !== false) { const clear = element('button', 'tpm-search-clear', '×'); clear.type = 'button'; clear.setAttribute('aria-label', 'Clear search'); clear.addEventListener('click', () => { input.value = ''; if (props.statePath) context.store.set(props.statePath, ''); input.focus?.(); }); node.appendChild(clear); }
        return node;
    });
    registerComponent('form-validation-summary', ({ props }) => {
        const errors = Array.isArray(props.errors) ? props.errors : []; const node = element('aside', 'tpm-validation-summary'); node.setAttribute('role', 'alert'); node.appendChild(element('strong', '', props.title || 'Please check the highlighted fields'));
        if (errors.length) { const list = element('ul'); errors.forEach((entry) => list.appendChild(element('li', '', isObject(entry) ? entry.message || entry.label || 'Invalid value' : entry))); node.appendChild(list); } return node;
    });
    registerComponent('mobile-accordion', ({ props }) => {
        const node = element('section', 'tpm-accordion'); (props.items || []).forEach((item, index) => { const data = isObject(item) ? item : { label: item }; const wrap = element('div', 'tpm-accordion-item'); const trigger = element('button', 'tpm-accordion-trigger', data.label || data.title || `Section ${index + 1}`); trigger.type = 'button'; const panel = element('div', 'tpm-accordion-panel', data.content || data.description || ''); const startOpen = data.open === true; trigger.setAttribute('aria-expanded', startOpen ? 'true' : 'false'); panel.setAttribute('aria-hidden', startOpen ? 'false' : 'true');
            trigger.addEventListener('click', () => { const open = trigger.getAttribute('aria-expanded') !== 'true'; trigger.setAttribute('aria-expanded', open ? 'true' : 'false'); panel.setAttribute('aria-hidden', open ? 'false' : 'true'); }); wrap.append(trigger, panel); node.appendChild(wrap); }); return node;
    });
    registerComponent('mobile-dialog', ({ props, element: specElement, context }) => {
        const launcher = element('div'); const trigger = element('button', 'tgui-button tgui-button-secondary', props.label || 'Open dialog'); trigger.type = 'button'; const backdrop = element('div', 'tpm-dialog-backdrop'); backdrop.hidden = true; backdrop.tabIndex = -1;
        const dialog = element('section', 'tpm-dialog'); dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true'); if (props.title) dialog.appendChild(element('div', 'tpm-dialog-head', props.title)); if (props.message) dialog.appendChild(element('div', 'tpm-dialog-body', props.message)); const body = element('div', 'tpm-dialog-body'); renderChildren(body, specElement.children, context); if (body.childNodes?.length) dialog.appendChild(body);
        const actions = element('div', 'tpm-dialog-actions'); const close = element('button', '', props.dismissLabel || 'Close'); close.type = 'button'; close.addEventListener('click', () => closeLayer(backdrop, trigger)); actions.appendChild(close); dialog.appendChild(actions); backdrop.appendChild(dialog); backdrop.addEventListener('click', (event) => { if (event.target === backdrop) closeLayer(backdrop, trigger); }); trigger.addEventListener('click', () => openLayer(backdrop, trigger)); launcher.append(trigger, backdrop); return launcher;
    });
    registerComponent('mobile-notification', ({ props }) => {
        const node = element('aside', 'tpm-notification'); node.setAttribute('role', 'status'); node.appendChild(element('span', 'tpm-notification-icon', props.icon || '•')); const copy = element('div', 'tpm-notification-copy'); copy.appendChild(element('strong', '', props.title || 'Notification')); if (props.message) copy.appendChild(element('span', '', props.message)); node.appendChild(copy); if (props.timeLabel) node.appendChild(element('span', 'tpm-notification-time', props.timeLabel)); return node;
    });
    registerComponent('mobile-alert', ({ props }) => { const node = element('aside', 'tpm-alert'); node.dataset.tone = props.tone || 'info'; node.setAttribute('role', props.tone === 'danger' ? 'alert' : 'status'); if (props.icon) node.appendChild(element('span', '', props.icon)); const copy = element('div'); if (props.title) copy.appendChild(element('strong', '', props.title)); if (props.message) copy.appendChild(element('div', '', props.message)); node.appendChild(copy); return node; });
    registerComponent('mobile-tooltip', ({ props }) => { const node = element('span', 'tpm-tooltip-anchor'); const anchor = element('span', '', props.label || 'Info'); const tip = element('span', 'tpm-tooltip', props.content || ''); tip.dataset.placement = props.placement || 'top'; tip.setAttribute('role', 'tooltip'); node.append(anchor, tip); return node; });
    registerComponent('mobile-progress', ({ props }) => { const max = Math.max(1, Number(props.max || 100)); const value = Math.max(0, Math.min(max, Number(props.value || 0))); const percent = value / max * 100; const node = element('div', 'tpm-progress'); node.dataset.striped = props.striped === true ? 'true' : 'false'; node.style.setProperty('--tpm-progress', `${percent}%`); const head = element('div', 'tpm-progress-head'); if (props.label) head.appendChild(element('span', '', props.label)); if (props.showValue !== false) head.appendChild(element('span', '', `${Math.round(percent)}%`)); node.appendChild(head); const track = element('div', 'tpm-progress-track'); track.setAttribute('role', 'progressbar'); track.setAttribute('aria-valuenow', String(value)); track.setAttribute('aria-valuemin', '0'); track.setAttribute('aria-valuemax', String(max)); track.appendChild(element('span', 'tpm-progress-bar')); node.appendChild(track); return node; });
    registerComponent('mobile-preloader', ({ props }) => { const node = element('span', 'tpm-preloader'); node.setAttribute('role', 'status'); node.appendChild(element('span', 'tpm-spinner')); if (props.label) node.appendChild(element('span', '', props.label)); return node; });
    registerComponent('mobile-pagination', ({ props, context }) => { const node = element('nav', 'tpm-pagination'); node.setAttribute('aria-label', 'Pagination'); const pages = Math.max(1, Number(props.pages || 1)); let page = Math.max(1, Math.min(pages, Number(props.statePath ? context.store.get(props.statePath) : props.page || 1))); const add = (label, target, current) => { const button = element('button', '', label); button.type = 'button'; if (current) button.setAttribute('aria-current', 'page'); button.addEventListener('click', () => { page = Math.max(1, Math.min(pages, target)); if (props.statePath) context.store.set(props.statePath, page); }); node.appendChild(button); }; add('‹', page - 1, false); for (let i = 1; i <= pages && i <= 7; i += 1) add(String(i), i, i === page); add('›', page + 1, false); return node; });
    registerComponent('go-to-top', ({ props }) => { const node = element('button', 'tpm-go-top', props.icon || '↑'); node.type = 'button'; node.setAttribute('aria-label', props.label || 'Go to top'); node.addEventListener('click', () => node.closest?.('.tpm-app-content')?.scrollTo?.({ top: 0, behavior: 'smooth' })); return node; });
    registerComponent('product-card', ({ props }) => { const node = element('article', 'tpm-product-card'); if (props.image) { const media = element('div', 'tpm-product-media'); const image = element('img'); image.src = safeUrl(props.image); image.alt = String(props.title || 'Product'); media.appendChild(image); if (props.badge) media.appendChild(element('span', 'tpm-mobile-badge tpm-product-badge', props.badge)); node.appendChild(media); } const body = element('div', 'tpm-product-body'); body.appendChild(element('strong', 'tpm-product-title', props.title || 'Product')); if (props.subtitle) body.appendChild(element('span', 'tpm-product-subtitle', props.subtitle)); const price = element('div', 'tpm-product-price'); if (props.price) price.appendChild(element('strong', '', props.price)); if (props.oldPrice) price.appendChild(element('del', '', props.oldPrice)); body.appendChild(price); if (props.rating !== undefined) body.appendChild(element('span', 'tpm-product-rating', `★ ${props.rating}`)); node.appendChild(body); return node; });
    registerComponent('price-summary', ({ props }) => { const node = element('section', 'tpm-price-summary'); (props.items || []).forEach((item) => { const data = isObject(item) ? item : { label: item }; const row = element('div', 'tpm-price-row'); row.append(element('span', '', data.label || ''), element('span', '', data.value ?? '')); node.appendChild(row); }); [['Subtotal',props.subtotal],['Discount',props.discount],['Tax',props.tax],['Shipping',props.shipping]].forEach(([label,value]) => { if (value === undefined || value === null || value === '') return; const row = element('div', 'tpm-price-row'); row.append(element('span', '', label), element('span', '', value)); node.appendChild(row); }); if (props.total !== undefined) { const total = element('div', 'tpm-price-row tpm-total'); total.append(element('span', '', 'Total'), element('span', '', props.total)); node.appendChild(total); } return node; });
    registerComponent('media-carousel', ({ props }) => { const node = element('section', 'tpm-carousel'); const track = element('div', 'tpm-carousel-track'); (props.items || []).forEach((item) => { const data = isObject(item) ? item : { src: item }; const slide = element('figure', 'tpm-carousel-slide'); if (data.src || data.image) { const image = element('img'); image.src = safeUrl(data.src || data.image); image.alt = String(data.alt || data.title || 'Media'); slide.appendChild(image); } track.appendChild(slide); }); node.appendChild(track); if (props.pagination !== false) { const dots = element('div', 'tpm-carousel-dots'); (props.items || []).forEach((_, index) => dots.appendChild(element('span', `tpm-carousel-dot ${index === 0 ? 'is-active' : ''}`))); node.appendChild(dots); } return node; });
    registerComponent('image-gallery', ({ props }) => { const node = element('div', 'tpm-image-gallery'); node.style.setProperty('--tpm-gallery-columns', String(Math.max(1, Math.min(4, Number(props.columns || 2))))); node.dataset.fit = props.fit || 'cover'; (props.images || []).forEach((item) => { const data = isObject(item) ? item : { src: item }; const figure = element('figure'); const image = element('img'); image.src = safeUrl(data.src || data.image); image.alt = String(data.alt || data.title || 'Gallery image'); figure.appendChild(image); node.appendChild(figure); }); return node; });
    registerComponent('mobile-badge', ({ props }) => { const node = element('span', 'tpm-mobile-badge', props.empty ? '' : (props.label || '')); node.dataset.tone = props.tone || 'primary'; node.dataset.empty = props.empty === true ? 'true' : 'false'; node.dataset.outline = props.outline === true ? 'true' : 'false'; return node; });


    // Premium Mobilekit v0.7 application patterns. Presentation-only renderers.
    registerComponent('auth-panel', ({ props }) => {
        const node = element('section', 'tpm-auth-panel');
        if (props.logo) { const img = element('img', 'tpm-auth-logo'); img.src = safeUrl(props.logo); img.alt = String(props.title || ''); node.appendChild(img); }
        node.appendChild(element('h2', 'tpm-auth-title', props.title || 'Welcome'));
        if (props.subtitle) node.appendChild(element('p', 'tpm-auth-subtitle', props.subtitle));
        const fields = Array.isArray(props.fields) && props.fields.length ? props.fields : [{ label: 'Email', type: 'email' }, { label: 'Password', type: 'password' }];
        fields.forEach((field, index) => { const data = isObject(field) ? field : { label: field }; const label = element('label', 'tpm-auth-field'); label.appendChild(element('span', '', data.label || `Field ${index + 1}`)); const input = element('input'); input.type = ['email','password','tel','text','number'].includes(data.type) ? data.type : 'text'; input.name = String(data.name || `field-${index + 1}`); input.placeholder = String(data.placeholder || ''); label.appendChild(input); node.appendChild(label); });
        const primary = element('button', 'tgui-button tgui-button-primary tpm-auth-primary', props.primaryLabel || 'Continue'); primary.type = 'button'; node.appendChild(primary);
        if (props.footerText) node.appendChild(element('p', 'tpm-auth-footer', props.footerText)); return node;
    });
    registerComponent('profile-hero', ({ props }) => {
        const node = element('section', 'tpm-profile-hero'); if (props.cover) { const cover = element('img', 'tpm-profile-cover'); cover.src = safeUrl(props.cover); cover.alt = ''; node.appendChild(cover); }
        const body = element('div', 'tpm-profile-hero-body'); const avatar = element('div', 'tpm-profile-avatar'); if (props.avatar) { const img = element('img'); img.src = safeUrl(props.avatar); img.alt = String(props.name || 'Profile'); avatar.appendChild(img); } else avatar.textContent = String(props.name || '?').split(/\s+/).map(v => v[0] || '').join('').slice(0,2).toUpperCase(); body.appendChild(avatar);
        const copy = element('div', 'tpm-profile-copy'); copy.appendChild(element('h2', '', props.name || 'Profile')); if (props.subtitle) copy.appendChild(element('span', 'tpm-profile-subtitle', props.subtitle)); if (props.badge) copy.appendChild(element('span', 'tpm-mobile-badge', props.badge)); if (props.bio) copy.appendChild(element('p', 'tpm-profile-bio', props.bio)); body.appendChild(copy); node.appendChild(body); return node;
    });
    registerComponent('profile-stat-grid', ({ props }) => { const node = element('div', 'tpm-profile-stats'); node.style.setProperty('--tpm-stat-columns', String(Math.max(1, Math.min(4, Number(props.columns || 3))))); (props.items || []).forEach(item => { const data = isObject(item) ? item : { label: item }; const card = element('div', 'tpm-profile-stat'); card.append(element('strong', '', data.value ?? '—'), element('span', '', data.label || '')); node.appendChild(card); }); return node; });
    registerComponent('chat-message', ({ props }) => { const row = element('article', 'tpm-chat-message'); row.dataset.direction = props.direction === 'out' ? 'out' : 'in'; if (props.avatar && row.dataset.direction !== 'out') { const img = element('img', 'tpm-chat-avatar'); img.src = safeUrl(props.avatar); img.alt = ''; row.appendChild(img); } const bubble = element('div', 'tpm-chat-bubble'); if (props.author) bubble.appendChild(element('strong', 'tpm-chat-author', props.author)); bubble.appendChild(element('div', 'tpm-chat-text', props.text || props.message || '')); const meta = element('small', 'tpm-chat-meta', [props.time, props.status].filter(Boolean).join(' · ')); if (meta.textContent) bubble.appendChild(meta); row.appendChild(bubble); return row; });
    registerComponent('chat-thread', ({ props }) => { const node = element('section', 'tpm-chat-thread'); const items = Array.isArray(props.items) ? props.items : []; if (!items.length) { node.appendChild(element('strong', '', props.emptyTitle || 'No messages yet')); if (props.emptyDescription) node.appendChild(element('p', '', props.emptyDescription)); return node; } items.forEach(item => node.appendChild(componentRegistry['chat-message']({ props: isObject(item) ? item : { text: item } }))); return node; });
    registerComponent('chat-composer', ({ props, context }) => { const node = element('div', 'tpm-chat-composer'); const input = element('textarea', 'tpm-chat-composer-input'); input.placeholder = String(props.placeholder || 'Write a message'); const path = props.statePath; input.value = String(path ? context.store.get(path) ?? props.value ?? '' : props.value ?? ''); if (path) input.addEventListener('input', () => context.store.set(path, input.value)); const send = element('button', 'tgui-button tgui-button-primary', props.sendLabel || 'Send'); send.type = 'button'; send.addEventListener('click', event => { const message = String(path ? context.store.get(path) ?? input.value : input.value).trim(); if (!message) return; emitAction({ action: 'communications.message.send', params: { message, preview: true } }, context, event); if (path) context.store.set(path, ''); input.value = ''; }); node.append(input, send); return node; });
    registerComponent('invoice-header', ({ props }) => { const node = element('header', 'tpm-invoice-header'); if (props.logo) { const img = element('img', 'tpm-invoice-logo'); img.src = safeUrl(props.logo); img.alt = ''; node.appendChild(img); } const copy = element('div'); copy.appendChild(element('h2', '', props.title || 'Invoice')); copy.appendChild(element('strong', 'tpm-invoice-number', props.invoiceNumber || '')); const meta = [props.status, props.issuedAt && `Issued ${props.issuedAt}`, props.dueAt && `Due ${props.dueAt}`].filter(Boolean).join(' · '); if (meta) copy.appendChild(element('span', 'tpm-invoice-meta', meta)); node.appendChild(copy); return node; });
    registerComponent('invoice-party', ({ props }) => { const node = element('section', 'tpm-invoice-party'); if (props.label) node.appendChild(element('span', 'tpm-invoice-party-label', props.label)); if (props.name) node.appendChild(element('strong', '', props.name)); [props.company,props.address,props.email,props.phone].filter(Boolean).forEach(value => node.appendChild(element('span', '', value))); return node; });
    registerComponent('invoice-line-items', ({ props }) => { const wrap = element('div', 'tpm-invoice-lines'); const table = element('table'); const head = element('tr'); ['Description', props.showQuantity === false ? null : 'Qty', 'Price', 'Total'].filter(Boolean).forEach(label => head.appendChild(element('th', '', label))); const thead = element('thead'); thead.appendChild(head); table.appendChild(thead); const body = element('tbody'); (props.items || []).forEach(item => { const data=isObject(item)?item:{description:item}; const row=element('tr'); row.appendChild(element('td','',data.description||data.label||'')); if (props.showQuantity !== false) row.appendChild(element('td','',data.quantity ?? 1)); row.appendChild(element('td','',data.unitPrice ?? data.price ?? '')); row.appendChild(element('td','',data.total ?? '')); body.appendChild(row); }); table.appendChild(body); wrap.appendChild(table); return wrap; });
    registerComponent('invoice-total', ({ props }) => { const node = element('section', 'tpm-invoice-total'); [['Subtotal',props.subtotal],['Discount',props.discount],['Tax',props.tax],['Shipping',props.shipping],['Paid',props.paid],['Total',props.total],['Balance',props.balance]].forEach(([label,value]) => { if (value === undefined || value === null || value === '') return; const row=element('div', `tpm-invoice-total-row ${label==='Total'||label==='Balance'?'is-strong':''}`); row.append(element('span','',label),element('strong','',value)); node.appendChild(row); }); return node; });
    registerComponent('cart-item', ({ props, context }) => { const node = element('article','tpm-cart-item'); if (props.image) { const img=element('img','tpm-cart-image'); img.src=safeUrl(props.image); img.alt=String(props.title||'Cart item'); node.appendChild(img); } const body=element('div','tpm-cart-body'); body.appendChild(element('strong','',props.title||'Item')); if (props.subtitle) body.appendChild(element('span','',props.subtitle)); if (props.price) body.appendChild(element('span','tpm-cart-price',props.price)); const path=props.statePath; let quantity=Number(path?context.store.get(path):props.quantity||1); const controls=element('div','tpm-cart-controls'); const minus=element('button','','−'); const out=element('output','',quantity); const plus=element('button','','+'); minus.type=plus.type='button'; const commit=n=>{quantity=Math.max(0,n);out.textContent=String(quantity);if(path)context.store.set(path,quantity)}; minus.addEventListener('click',()=>commit(quantity-1)); plus.addEventListener('click',()=>commit(quantity+1)); controls.append(minus,out,plus); body.appendChild(controls); node.appendChild(body); return node; });
    registerComponent('product-detail', ({ props }) => { const node=element('article','tpm-product-detail'); if(props.image){const img=element('img','tpm-product-detail-image');img.src=safeUrl(props.image);img.alt=String(props.title||'Product');node.appendChild(img);} const body=element('div','tpm-product-detail-body'); if(props.badge)body.appendChild(element('span','tpm-mobile-badge',props.badge)); body.appendChild(element('h2','',props.title||'Product')); if(props.subtitle)body.appendChild(element('span','tpm-product-subtitle',props.subtitle)); const price=element('div','tpm-product-detail-price'); if(props.price)price.appendChild(element('strong','',props.price)); if(props.oldPrice)price.appendChild(element('del','',props.oldPrice)); body.appendChild(price); if(props.description)body.appendChild(element('p','',props.description)); if(Array.isArray(props.features)){const list=element('ul','tpm-product-features');props.features.forEach(v=>list.appendChild(element('li','',isObject(v)?v.label||v.text:v)));body.appendChild(list);} node.appendChild(body); return node; });
    registerComponent('rating-summary', ({ props }) => { const node=element('section','tpm-rating-summary'); node.appendChild(element('strong','tpm-rating-value',Number(props.rating||0).toFixed(1))); node.appendChild(element('span','tpm-rating-stars','★★★★★')); if(props.count!==undefined)node.appendChild(element('span','tpm-rating-count',`${props.count} reviews`)); const bars=element('div','tpm-rating-breakdown'); (props.breakdown||[]).forEach(item=>{const data=isObject(item)?item:{}; const row=element('div','tpm-rating-row');row.appendChild(element('span','',`${data.stars||0}★`));const track=element('span','tpm-rating-track');const fill=element('span','tpm-rating-fill');fill.style.width=`${Math.max(0,Math.min(100,Number(data.percent||0)))}%`;track.appendChild(fill);row.appendChild(track);bars.appendChild(row)});node.appendChild(bars);return node; });
    registerComponent('article-header', ({ props }) => { const node=element('header','tpm-article-header'); if(props.eyebrow)node.appendChild(element('span','tpm-article-eyebrow',props.eyebrow)); node.appendChild(element('h1','',props.title||'Article')); const meta=[props.author,props.publishedAt,props.readingTime].filter(Boolean).join(' · '); if(meta)node.appendChild(element('span','tpm-article-meta',meta)); if(props.image){const img=element('img','tpm-article-hero');img.src=safeUrl(props.image);img.alt=String(props.title||'');node.appendChild(img);} return node; });
    registerComponent('article-body', ({ props }) => { const node=element('article','tpm-article-body'); if(props.lead)node.appendChild(element('p','tpm-article-lead',props.lead)); (props.paragraphs||[]).forEach(p=>node.appendChild(element('p','',isObject(p)?p.text||p.content:p))); if(props.quote){const q=element('blockquote','',isObject(props.quote)?props.quote.text||props.quote.content:props.quote);node.appendChild(q);} if(props.image){const fig=element('figure');const img=element('img');img.src=safeUrl(props.image);img.alt='';fig.appendChild(img);if(props.caption)fig.appendChild(element('figcaption','',props.caption));node.appendChild(fig);} return node; });
    registerComponent('social-links', ({ props }) => { const node=element('nav','tpm-social-links'); if(props.label)node.setAttribute('aria-label',String(props.label)); node.dataset.layout=props.layout||'row'; (props.items||[]).forEach(item=>{const data=isObject(item)?item:{label:item};const link=element('a','tpm-social-link',data.label||data.name||'Link');link.href=safeUrl(data.url||data.href||'#');if(data.external===true){link.target='_blank';link.rel='noopener noreferrer';}node.appendChild(link);});return node; });
    registerComponent('system-state', ({ props }) => { const node=element('section','tpm-system-state');node.dataset.state=props.state||'empty';if(props.image){const img=element('img','tpm-system-state-image');img.src=safeUrl(props.image);img.alt='';node.appendChild(img);}else if(props.icon)node.appendChild(element('div','tpm-system-state-icon',props.icon));node.appendChild(element('h2','',props.title||'Nothing to show'));if(props.description)node.appendChild(element('p','',props.description));if(props.actionLabel){const button=element('button','tgui-button tgui-button-primary',props.actionLabel);button.type='button';node.appendChild(button);}if(props.secondaryLabel){const secondary=element('button','tgui-button tgui-button-secondary',props.secondaryLabel);secondary.type='button';node.appendChild(secondary);}return node; });

    function svgNode(name, attrs = {}) { const node = document.createElementNS('http://www.w3.org/2000/svg', name); Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value))); return node; }
    function numericSeries(props) { return (props.values || props.data || []).map((item) => Number(isObject(item) ? item.value : item)).filter(Number.isFinite); }
    registerComponent('chart-bar', ({ props }) => { const node = element('div', 'tgui-chart tgui-chart-bar'); const values = numericSeries(props); const max = Math.max(1, ...values); values.forEach((value, index) => { const bar = element('div', 'tgui-chart-bar-item'); bar.style.height = `${Math.max(3, value / max * 100)}%`; bar.title = `${props.labels?.[index] || index + 1}: ${value}`; node.appendChild(bar); }); return node; });
    const lineChart = ({ props, compact = false }) => { const values = numericSeries(props); const svg = svgNode('svg', { viewBox: '0 0 100 40', role: 'img', 'aria-label': props.label || 'Chart' }); svg.classList.add(compact ? 'tgui-sparkline' : 'tgui-line-chart'); const max = Math.max(1, ...values), min = Math.min(0, ...values), span = Math.max(1, max - min); const points = values.map((value, index) => `${values.length < 2 ? 0 : index / (values.length - 1) * 100},${38 - ((value - min) / span * 34)}`).join(' '); svg.appendChild(svgNode('polyline', { points, fill: 'none', stroke: 'currentColor', 'stroke-width': compact ? 3 : 2, 'vector-effect': 'non-scaling-stroke' })); return svg; };
    registerComponent('chart-line', ({ props }) => lineChart({ props }));
    registerComponent('chart-sparkline', ({ props }) => lineChart({ props, compact: true }));
    registerComponent('chart-donut', ({ props }) => { const node = element('div', 'tgui-donut'); const values = numericSeries(props); const total = values.reduce((sum, value) => sum + Math.max(0, value), 0) || 1; let cursor = 0; const segments = values.map((value, index) => { const start = cursor; cursor += Math.max(0, value) / total * 360; return `var(--tgui-chart-${index % 5}) ${start}deg ${cursor}deg`; }); node.style.background = `conic-gradient(${segments.join(',')})`; node.appendChild(element('span', 'tgui-donut-label', props.label || total)); return node; });
    registerComponent('chart-radial', ({ props }) => { const value = Math.max(0, Math.min(100, Number(props.value || 0))); const node = element('div', 'tgui-radial'); node.style.background = `conic-gradient(var(--tgui-primary) ${value * 3.6}deg,var(--tgui-muted) 0)`; node.appendChild(element('span', 'tgui-radial-label', props.label || `${value}%`)); return node; });

    // Existing catalogue aliases useful for generated chat specs.
    registerComponent('status-pill', componentRegistry.badge);
    registerComponent('stat-card', componentRegistry.metric);
    registerComponent('empty-state', ({ props }) => { const node = element('div', 'tgui-empty'); if (props.title) node.appendChild(element('strong', '', props.title)); if (props.description) node.appendChild(element('p', '', props.description)); return node; });
    registerComponent('skeleton', ({ props }) => { const node = element('div', 'tgui-skeleton'); node.style.height = `${Number(props.height || 48)}px`; return node; });

    return {
        parsePointer, getByPath, setByPath, removeByPath, createStateStore, createPersistentStateStore,
        normaliseSpec, createSpecController,
        resolveValue, evaluateVisibility, validateField, deepMerge, applyJsonPatch,
        extractSpec, registerComponent, renderSpec, renderMessage, validateSpecClient,
        components: componentRegistry,
    };
});
