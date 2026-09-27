(() => {
  const root = window.TitanWorkCore = window.TitanWorkCore || {};
  const C = root.contracts;
  const emit = (name, detail = {}) => window.dispatchEvent(new CustomEvent(name, { detail }));
  const iso = () => new Date().toISOString();
  const esc = value => { const node = document.createElement('div'); node.textContent = String(value ?? ''); return node.innerHTML; };

  const state = { mounted: false, open: false, packs: [], selected: null, filter: 'today' };

  function packJob(pack) { return pack.job || pack.work_order || pack; }
  function packId(pack) { return String(pack.id || packJob(pack)?.id || ''); }
  function resourceKey(pack) { return `work_order:${packJob(pack)?.id || packId(pack)}`; }
  function scheduleOf(pack) { return pack.scheduled_at || packJob(pack)?.scheduled_at || pack.schedule?.start_at || pack.appointment?.starts_at || null; }
  function titleOf(pack) { const job = packJob(pack); return job?.title || job?.reference || job?.number || `Job ${packId(pack)}`; }
  function customerOf(pack) { return pack.customer?.name || packJob(pack)?.customer_name || pack.contact?.name || 'Customer'; }
  function addressOf(pack) { return pack.premises?.formatted_address || pack.premises?.address || pack.property?.address || packJob(pack)?.address || ''; }
  function statusOf(pack) { return packJob(pack)?.status || pack.status || 'assigned'; }
  function isToday(value) { if (!value) return true; const d = new Date(value), now = new Date(); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate(); }
  function tasksOf(pack) { return pack.tasks || pack.checklist?.items || pack.checklists?.flatMap(item => item.items || []) || []; }
  function formsOf(pack) { return pack.forms || pack.form_templates || []; }

  async function saveDraft(id, resource_key, kind, data) {
    return root.db.put(C.stores.drafts, { id, resource_key, kind, data, updated_at: iso() });
  }
  async function getDraft(id) { return root.db.get(C.stores.drafts, id); }

  async function queue(command, payload, pack, options = {}) {
    const job = packJob(pack);
    const operation = await root.client.queue(command, { work_order_id: job.id, ...payload }, {
      resource_key: resourceKey(pack),
      base_revision: job.revision ?? pack.revision ?? null,
      base_etag: job.etag || pack.etag || null,
      ...options
    });
    emit('workcore:field-action-queued', { operation, pack });
    await renderDetail();
    return operation;
  }

  async function updateTask(pack, task, checked) {
    const taskId = task.id || task.task_id || task.key;
    await saveDraft(`task:${packId(pack)}:${taskId}`, resourceKey(pack), 'task', { task_id: taskId, completed: checked });
    return queue(C.commands.COMPLETE_TASK, { task_id: taskId, status: checked ? 'completed' : 'pending', completed_at: checked ? iso() : null }, pack);
  }

  async function submitTime(pack, form) {
    const minutes = Number(form.elements.minutes.value || 0);
    if (!Number.isFinite(minutes) || minutes <= 0) throw new Error('Enter a valid number of minutes.');
    const note = form.elements.note.value.trim();
    await queue(C.commands.ADD_TIME_ENTRY, { minutes, note, started_at: form.elements.started_at.value || null, ended_at: iso() }, pack);
    form.reset();
  }

  async function reportIncident(pack, form) {
    const description = form.elements.description.value.trim();
    if (!description) throw new Error('Describe the incident.');
    await queue(C.commands.REPORT_INCIDENT, { severity: form.elements.severity.value, description, occurred_at: iso() }, pack);
    form.reset();
  }

  async function consumeInventory(pack, form) {
    const inventory_item_id = form.elements.inventory_item_id.value.trim();
    const quantity = Number(form.elements.quantity.value || 0);
    if (!inventory_item_id || !Number.isFinite(quantity) || quantity <= 0) throw new Error('Enter an item and quantity.');
    await queue(C.commands.CONSUME_INVENTORY, { inventory_item_id, quantity, unit: form.elements.unit.value.trim() || null }, pack);
    form.reset();
  }

  async function submitForm(pack, formDef, formElement) {
    const fields = {};
    new FormData(formElement).forEach((value, key) => { fields[key] = value; });
    await saveDraft(`form:${packId(pack)}:${formDef.id}`, resourceKey(pack), 'form', fields);
    await queue(C.commands.SUBMIT_FORM, { form_id: formDef.id, values: fields, submitted_at: iso() }, pack);
  }

  async function captureEvidence(pack, files, category = 'evidence') {
    const saved = [];
    for (const file of Array.from(files || [])) {
      const attachment = await root.attachments.save(file, { resource_key: resourceKey(pack), category });
      const operation = await queue(C.commands.ADD_EVIDENCE, {
        attachment_id: attachment.id, category, name: attachment.name,
        mime_type: attachment.type, checksum: attachment.checksum, captured_at: iso()
      }, pack);
      await root.attachments.update(attachment.id, { operation_id: operation.operation_id });
      saved.push(attachment);
    }
    emit('workcore:evidence-captured', { pack, attachments: saved });
    return saved;
  }

  function mount() {
    if (state.mounted || !C || !root.client) return;
    state.mounted = true;
    const shell = document.createElement('section');
    shell.id = 'workcore-field-workspace';
    shell.className = 'workcore-field-workspace';
    shell.hidden = true;
    shell.innerHTML = `
      <header><button type="button" data-field-close aria-label="Close field workspace">×</button><div><strong>Today's work</strong><small data-field-subtitle>Offline-ready WorkCore jobs</small></div><button type="button" data-field-refresh>Refresh</button></header>
      <div class="workcore-field-body"><nav data-field-list aria-label="Assigned jobs"></nav><main data-field-detail><div class="workcore-field-empty"><strong>No job selected</strong><span>Choose an assigned job to work offline.</span></div></main></div>`;
    document.body.appendChild(shell);

    const launcher = document.createElement('button');
    launcher.type = 'button'; launcher.className = 'workcore-field-launcher'; launcher.textContent = 'Today’s jobs';
    launcher.addEventListener('click', open);
    document.body.appendChild(launcher);

    shell.querySelector('[data-field-close]').addEventListener('click', close);
    shell.querySelector('[data-field-refresh]').addEventListener('click', async () => {
      setSubtitle('Refreshing assigned jobs…');
      try { await root.client.pullJobPacks({ assigned_only: true }); await load(); }
      catch (error) { setSubtitle(error.message); }
    });

    const params = new URLSearchParams(location.search);
    if (params.get('view') === 'workcore-jobs') open();
    load();
  }

  function setSubtitle(text) { document.querySelector('[data-field-subtitle]')?.replaceChildren(document.createTextNode(text)); }
  async function open() { state.open = true; document.getElementById('workcore-field-workspace').hidden = false; document.documentElement.classList.add('workcore-field-open'); await load(); }
  function close() { state.open = false; document.getElementById('workcore-field-workspace').hidden = true; document.documentElement.classList.remove('workcore-field-open'); }

  async function load() {
    state.packs = await root.client.listJobPacks();
    state.packs.sort((a, b) => String(scheduleOf(a) || '').localeCompare(String(scheduleOf(b) || '')));
    if (state.selected) state.selected = state.packs.find(pack => packId(pack) === packId(state.selected)) || null;
    renderList(); await renderDetail();
    setSubtitle(`${state.packs.length} downloaded job${state.packs.length === 1 ? '' : 's'} — ${navigator.onLine ? 'online' : 'offline'}`);
  }

  function renderList() {
    const nav = document.querySelector('[data-field-list]'); if (!nav) return;
    const packs = state.filter === 'today' ? state.packs.filter(pack => isToday(scheduleOf(pack))) : state.packs;
    nav.innerHTML = `<div class="workcore-field-filter"><button type="button" data-filter="today" aria-pressed="${state.filter === 'today'}">Today</button><button type="button" data-filter="all" aria-pressed="${state.filter === 'all'}">Downloaded</button></div><div data-job-items></div>`;
    nav.querySelectorAll('[data-filter]').forEach(button => button.onclick = () => { state.filter = button.dataset.filter; renderList(); });
    const list = nav.querySelector('[data-job-items]');
    for (const pack of packs) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'workcore-job-card';
      button.dataset.selected = String(Boolean(state.selected && packId(pack) === packId(state.selected)));
      const schedule = scheduleOf(pack) ? new Date(scheduleOf(pack)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Any time';
      button.innerHTML = `<span><b>${esc(schedule)}</b><em>${esc(statusOf(pack))}</em></span><strong>${esc(titleOf(pack))}</strong><small>${esc(customerOf(pack))}${addressOf(pack) ? ` · ${esc(addressOf(pack))}` : ''}</small>`;
      button.onclick = async () => { state.selected = pack; renderList(); await renderDetail(); };
      list.appendChild(button);
    }
    if (!packs.length) list.innerHTML = '<div class="workcore-field-empty"><strong>No downloaded jobs</strong><span>Refresh while online to download assigned WorkCore job packs.</span></div>';
  }

  async function renderDetail() {
    const main = document.querySelector('[data-field-detail]'); if (!main) return;
    const pack = state.selected;
    if (!pack) { main.innerHTML = '<div class="workcore-field-empty"><strong>No job selected</strong><span>Choose an assigned job to work offline.</span></div>'; return; }
    const job = packJob(pack), tasks = tasksOf(pack), forms = formsOf(pack);
    main.innerHTML = `
      <article class="workcore-job-detail">
        <section class="workcore-job-hero"><div><small>${esc(customerOf(pack))}</small><h2>${esc(titleOf(pack))}</h2><p>${esc(addressOf(pack))}</p></div><span>${esc(statusOf(pack))}</span></section>
        <section class="workcore-job-actions">
          <button type="button" data-command="arrive">Arrived</button><button type="button" data-command="start">Start</button><button type="button" data-command="complete">Complete</button><button type="button" data-location>Stamp location</button><button type="button" data-wake-lock>Keep screen awake</button>
          ${addressOf(pack) ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressOf(pack))}" target="_blank" rel="noopener">Navigate</a>` : ''}
        </section>
        ${pack.access_instructions || pack.premises?.access_instructions ? `<section><h3>Access instructions</h3><p>${esc(pack.access_instructions || pack.premises.access_instructions)}</p></section>` : ''}
        <section><h3>Checklist</h3><div data-task-list></div></section>
        <section><h3>Evidence</h3><div class="workcore-device-actions"><label class="workcore-capture">Take photo<input type="file" accept="image/*" capture="environment" multiple data-evidence></label><label class="workcore-capture">Add files<input type="file" accept="image/*,application/pdf,audio/*" multiple data-evidence></label><button type="button" data-voice>Record voice note</button><label class="workcore-capture">Scan QR/barcode<input type="file" accept="image/*" capture="environment" data-code-image></label></div><div data-device-result class="workcore-device-result" aria-live="polite"></div><small>Evidence is stored locally first and upload resumes after interruption.</small></section>
        <section><h3>Customer signature</h3><canvas width="640" height="220" data-signature aria-label="Signature pad"></canvas><div class="workcore-signature-actions"><button type="button" data-signature-clear>Clear</button><button type="button" data-signature-save>Save signature</button></div><small>The signature is stored locally first and queued as WorkCore evidence.</small></section>
        <section><h3>Time entry</h3><form data-time-form><input name="minutes" type="number" min="1" inputmode="numeric" placeholder="Minutes" required><input name="note" placeholder="Work note"><input name="started_at" type="datetime-local"><button>Queue time</button></form></section>
        <section><h3>Incident</h3><form data-incident-form><select name="severity"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select><textarea name="description" placeholder="What happened?" required></textarea><button>Report incident</button></form></section>
        <section><h3>Supplies used</h3><form data-inventory-form><input name="inventory_item_id" placeholder="Item ID or code" required><input name="quantity" type="number" min="0.01" step="0.01" placeholder="Quantity" required><input name="unit" placeholder="Unit"><button>Record use</button></form></section>
        <section data-forms-section><h3>Forms</h3><div data-form-list></div></section>
      </article>`;

    const taskList = main.querySelector('[data-task-list]');
    if (!tasks.length) taskList.innerHTML = '<small>No checklist items in this job pack.</small>';
    for (const task of tasks) {
      const id = task.id || task.task_id || task.key;
      const draft = await getDraft(`task:${packId(pack)}:${id}`);
      const checked = draft?.data?.completed ?? ['complete','completed','done'].includes(String(task.status || '').toLowerCase());
      const label = document.createElement('label'); label.className = 'workcore-task';
      label.innerHTML = `<input type="checkbox" ${checked ? 'checked' : ''}><span>${esc(task.title || task.name || task.label || `Task ${id}`)}</span>`;
      label.querySelector('input').onchange = event => updateTask(pack, task, event.target.checked).catch(showError);
      taskList.appendChild(label);
    }

    const formList = main.querySelector('[data-form-list]');
    if (!forms.length) main.querySelector('[data-forms-section]').hidden = true;
    for (const formDef of forms) {
      const form = document.createElement('form'); form.className = 'workcore-dynamic-form';
      form.innerHTML = `<strong>${esc(formDef.title || formDef.name || 'Job form')}</strong>`;
      for (const field of formDef.fields || []) {
        const name = field.name || field.key || field.id;
        const label = document.createElement('label'); label.textContent = field.label || name;
        const input = field.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
        input.name = name; input.required = Boolean(field.required); if (input.tagName === 'INPUT') input.type = ['number','date','time','email','tel'].includes(field.type) ? field.type : 'text';
        label.appendChild(input); form.appendChild(label);
      }
      const button = document.createElement('button'); button.textContent = 'Submit form'; form.appendChild(button);
      form.onsubmit = event => { event.preventDefault(); submitForm(pack, formDef, form).catch(showError); };
      formList.appendChild(form);
    }

    main.querySelector('[data-command="arrive"]').onclick = async () => { let location = null; try { location = await root.device?.getLocation({ maximumAge: 30000 }); } catch (_) {} return queue(C.commands.MARK_ARRIVED, { arrived_at: iso(), location }, pack).catch(showError); };
    main.querySelector('[data-command="start"]').onclick = () => queue(C.commands.START_JOB, { started_at: iso() }, pack).catch(showError);
    main.querySelector('[data-command="complete"]').onclick = () => confirm('Queue this job for completion?') && queue(C.commands.COMPLETE_JOB, { completed_at: iso() }, pack).catch(showError);
    main.querySelectorAll('[data-evidence]').forEach(input => input.onchange = event => captureEvidence(pack, event.target.files).then(() => { event.target.value = ''; }).catch(showError));
    const deviceResult = main.querySelector('[data-device-result]');
    main.querySelector('[data-location]').onclick = async () => { try { const location = await root.device.getLocation(); await saveDraft(`location:${packId(pack)}`, resourceKey(pack), 'location', location); deviceResult.textContent = `Location saved (±${Math.round(location.accuracy_m || 0)} m).`; } catch (error) { showError(error); } };
    main.querySelector('[data-wake-lock]').onclick = async event => { const lock = await root.device?.requestWakeLock(); event.currentTarget.textContent = lock ? 'Screen will stay awake' : 'Wake lock unavailable'; };
    main.querySelector('[data-voice]').onclick = async event => { try { if (root.device?.state.recorder?.state === 'recording') { const result = await root.device.stopVoiceRecording(); await captureEvidence(pack, [result.file], 'voice_note'); event.currentTarget.textContent = 'Record voice note'; deviceResult.textContent = `Voice note queued (${Math.round(result.duration_ms / 1000)} sec).`; } else { await root.device.startVoiceRecording(); event.currentTarget.textContent = 'Stop and save voice note'; deviceResult.textContent = 'Recording…'; } } catch (error) { showError(error); } };
    main.querySelector('[data-code-image]').onchange = async event => { try { const file = event.target.files?.[0]; if (!file) return; const results = await root.device.scanImage(file); deviceResult.textContent = results.length ? `Detected: ${results.map(item => item.raw_value).join(', ')}` : 'No QR or barcode detected.'; if (results[0]) await saveDraft(`code:${packId(pack)}:${Date.now()}`, resourceKey(pack), 'scanned_code', results[0]); } catch (error) { showError(error); } finally { event.target.value = ''; } };
    const signature = main.querySelector('[data-signature]');
    const signatureContext = signature.getContext('2d');
    signatureContext.lineWidth = 3; signatureContext.lineCap = 'round'; signatureContext.strokeStyle = '#ffffff';
    let drawing = false, signed = false;
    const point = event => { const rect = signature.getBoundingClientRect(), source = event.touches?.[0] || event; return { x: (source.clientX - rect.left) * signature.width / rect.width, y: (source.clientY - rect.top) * signature.height / rect.height }; };
    const begin = event => { event.preventDefault(); drawing = true; signed = true; const p = point(event); signatureContext.beginPath(); signatureContext.moveTo(p.x, p.y); };
    const draw = event => { if (!drawing) return; event.preventDefault(); const p = point(event); signatureContext.lineTo(p.x, p.y); signatureContext.stroke(); };
    const end = () => { drawing = false; };
    signature.addEventListener('pointerdown', begin); signature.addEventListener('pointermove', draw); window.addEventListener('pointerup', end);
    signature.addEventListener('touchstart', begin, { passive: false }); signature.addEventListener('touchmove', draw, { passive: false }); signature.addEventListener('touchend', end);
    main.querySelector('[data-signature-clear]').onclick = () => { signatureContext.clearRect(0, 0, signature.width, signature.height); signed = false; };
    main.querySelector('[data-signature-save]').onclick = () => {
      if (!signed) return showError(new Error('Ask the customer to sign first.'));
      signature.toBlob(blob => blob && captureEvidence(pack, [new File([blob], `signature-${packId(pack)}.png`, { type: 'image/png' })], 'signature').catch(showError), 'image/png');
    };
    main.querySelector('[data-time-form]').onsubmit = event => { event.preventDefault(); submitTime(pack, event.currentTarget).catch(showError); };
    main.querySelector('[data-incident-form]').onsubmit = event => { event.preventDefault(); reportIncident(pack, event.currentTarget).catch(showError); };
    main.querySelector('[data-inventory-form]').onsubmit = event => { event.preventDefault(); consumeInventory(pack, event.currentTarget).catch(showError); };
  }

  function showError(error) { emit('workcore:field-error', { error }); setSubtitle(error.message || 'Field action failed'); }

  ['workcore:job-packs-pulled','workcore:sync-complete','workcore:tombstone-applied','workcore:local-reset'].forEach(name => window.addEventListener(name, load));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();
  root.field = { mount, open, close, load, captureEvidence, updateTask, submitTime, reportIncident, consumeInventory, submitForm, state };
})();
