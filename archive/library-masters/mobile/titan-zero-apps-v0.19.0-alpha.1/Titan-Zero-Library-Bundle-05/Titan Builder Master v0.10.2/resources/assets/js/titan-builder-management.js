(function () {
    'use strict';
    const csrf = document.querySelector('meta[name="csrf-token"]')?.content || '';
    const notice = document.getElementById('tbm-live-notice');
    const show = (message, error = false) => {
        if (!notice) return;
        notice.hidden = false;
        notice.className = `tbm-notice ${error ? 'is-error' : 'is-success'}`;
        notice.textContent = message;
        notice.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    const request = async (url, options = {}) => {
        const headers = { Accept: 'application/json', 'X-CSRF-TOKEN': csrf, ...(options.headers || {}) };
        if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
        const response = await fetch(url, { credentials: 'same-origin', ...options, headers });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || data.error || `Request failed (${response.status})`);
        return data;
    };
    const formObject = (form) => Object.fromEntries([...new FormData(form).entries()].filter(([, value]) => value !== ''));

    document.querySelector('[data-tbm-sidebar-toggle]')?.addEventListener('click', () => document.getElementById('tbm-sidebar')?.classList.toggle('is-open'));

    document.querySelectorAll('[data-tbm-tabs]').forEach((tabs) => {
        const buttons = [...tabs.querySelectorAll('[data-tab]')];
        const panels = [...document.querySelectorAll('[data-panel]')];
        const activate = (name) => { buttons.forEach((b) => b.classList.toggle('is-active', b.dataset.tab === name)); panels.forEach((p) => p.hidden = p.dataset.panel !== name); };
        buttons.forEach((button) => button.addEventListener('click', () => activate(button.dataset.tab)));
        if (buttons[0]) activate(buttons[0].dataset.tab);
    });

    document.querySelectorAll('[data-tbm-json-form]').forEach((form) => form.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
            const payload = formObject(form);
            const data = await request(form.dataset.endpoint, { method: form.dataset.method || 'POST', body: JSON.stringify(payload) });
            show(data.message || 'Saved.');
            if (form.dataset.reload === 'true') window.location.reload();
        } catch (error) { show(error.message, true); }
    }));

    document.querySelectorAll('[data-tbm-nested-json-form]').forEach((form) => form.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
            const parsed = JSON.parse(form.querySelector('[name=json]').value || '{}');
            const payload = { [form.dataset.key]: parsed };
            await request(form.dataset.endpoint, { method: form.dataset.method || 'PATCH', body: JSON.stringify(payload) });
            show(`${form.dataset.key} saved.`);
        } catch (error) { show(error.message, true); }
    }));

    document.querySelectorAll('[data-tbm-asset-form]').forEach((form) => form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const data = new FormData(form); const project = data.get('project'); data.delete('project');
        try {
            await request(form.dataset.endpointTemplate.replace('__PROJECT__', String(project)), { method: 'POST', body: data });
            show('Asset uploaded.'); window.location.reload();
        } catch (error) { show(error.message, true); }
    }));

    document.querySelectorAll('[data-tbm-brand-form]').forEach((form) => form.addEventListener('submit', async (event) => {
        event.preventDefault();
        try { await request(form.dataset.endpoint, { method: 'PATCH', body: JSON.stringify({ brand: formObject(form) }) }); show('Brand applied to all four applications.'); }
        catch (error) { show(error.message, true); }
    }));

    document.querySelectorAll('[data-tbm-app-action]').forEach((button) => button.addEventListener('click', async () => {
        try { const data = await request(button.dataset.endpoint, { method: button.dataset.method || 'POST', body: JSON.stringify({}) }); show(data.message || 'Application action completed.'); if (button.dataset.reload === 'true') window.location.reload(); }
        catch (error) { show(error.message, true); }
    }));

    document.querySelector('[data-tbm-provision-set]')?.addEventListener('click', async (event) => {
        try { await request(event.currentTarget.dataset.endpoint, { method: 'POST', body: JSON.stringify({ configuration: {} }) }); show('Four-application provisioning completed.'); window.location.reload(); }
        catch (error) { show(error.message, true); }
    });

    document.querySelector('[data-tbm-app-preview]')?.addEventListener('click', async (event) => {
        try {
            const data = await request(event.currentTarget.dataset.endpoint, { method: 'POST', body: JSON.stringify({ device: document.getElementById('tbm-app-preview-device')?.value || 'mobile', state: document.getElementById('tbm-app-preview-state')?.value || 'online' }) });
            const output = document.getElementById('tbm-app-preview-output'); output.hidden = false; output.textContent = JSON.stringify(data, null, 2);
        } catch (error) { show(error.message, true); }
    });

    const editor = document.querySelector('[data-tbm-editor]');
    if (editor) {
        const textarea = document.getElementById('tbm-spec-editor');
        const output = document.getElementById('tbm-validation-output');
        const canvas = document.getElementById('tbm-preview-canvas');
        let pageId = null;
        const parseSpec = () => JSON.parse(textarea.value || '{}');
        const selectPage = (button) => {
            pageId = button.dataset.pageId;
            document.querySelectorAll('[data-tbm-page]').forEach((b) => b.classList.toggle('is-active', b === button));
            document.getElementById('tbm-current-page').textContent = button.dataset.pageName || `Page #${pageId}`;
            const source = document.getElementById(`tbm-spec-${pageId}`); const spec = JSON.parse(source?.textContent || '{}'); textarea.value = JSON.stringify(spec, null, 2);
        };
        document.querySelectorAll('[data-tbm-page]').forEach((button) => button.addEventListener('click', () => selectPage(button)));
        const first = document.querySelector('[data-tbm-page]'); if (first) selectPage(first);
        document.querySelector('[data-tbm-validate]')?.addEventListener('click', async () => {
            try { const data = await request(editor.dataset.validateUrl, { method: 'POST', body: JSON.stringify({ spec: parseSpec() }) }); output.hidden = false; output.textContent = JSON.stringify(data, null, 2); show(data.valid ? 'Spec is valid.' : 'Spec has validation issues.', !data.valid); }
            catch (error) { show(error.message, true); }
        });
        document.querySelector('[data-tbm-preview]')?.addEventListener('click', async () => {
            try {
                const spec = parseSpec(); const device = document.getElementById('tbm-preview-device')?.value || 'mobile';
                const data = await request(editor.dataset.previewUrl, { method: 'POST', body: JSON.stringify({ spec, product_surface: editor.dataset.projectSurface || 'owner', device, network: 'online' }) });
                if (globalThis.TitanGenerativeUI?.renderSpec) { canvas.replaceChildren(); globalThis.TitanGenerativeUI.renderSpec(data.spec || spec, canvas, { data: data.mock_data || {} }); }
                else { canvas.textContent = JSON.stringify(data, null, 2); }
                show('Preview generated.');
            } catch (error) { show(error.message, true); }
        });
        document.querySelector('[data-tbm-save-spec]')?.addEventListener('click', async () => {
            if (!pageId) return show('Select a page first.', true);
            try { await request(`${editor.dataset.pageStoreBase}/${pageId}/spec`, { method: 'PUT', body: JSON.stringify({ spec: parseSpec() }) }); show('Draft saved.'); }
            catch (error) { show(error.message, true); }
        });
        document.querySelector('[data-tbm-ai]')?.addEventListener('click', async () => {
            const prompt = document.getElementById('tbm-ai-prompt')?.value?.trim(); if (!prompt) return show('Enter an AI request first.', true);
            try { const data = await request(editor.dataset.proposeUrl, { method: 'POST', body: JSON.stringify({ prompt, project_id: Number(editor.dataset.projectId), surface: parseSpec().surface || 'builder', current_application_spec: parseSpec() }) }); if (data.proposal) textarea.value = JSON.stringify(data.proposal, null, 2); output.hidden = false; output.textContent = JSON.stringify(data.validation || data, null, 2); show('TitanAI proposal loaded for review.'); }
            catch (error) { show(error.message, true); }
        });
    }

    document.querySelector('[data-tbm-publish]')?.addEventListener('click', async (event) => { try { await request(event.currentTarget.dataset.endpoint, { method: 'POST', body: JSON.stringify({}) }); show('Project published.'); } catch (error) { show(error.message, true); } });
    document.querySelectorAll('[data-tbm-rollback]').forEach((button) => button.addEventListener('click', async () => { if (!confirm('Rollback to this immutable snapshot?')) return; try { await request(button.dataset.endpoint, { method: 'POST', body: JSON.stringify({}) }); show('Rollback completed.'); window.location.reload(); } catch (error) { show(error.message, true); } }));
})();
