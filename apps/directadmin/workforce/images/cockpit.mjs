import * as SDK from 'titan-sdk';
import { WorkforceController } from 'workforce-controller';
import { WorkforceApi } from 'workforce-api';
import { boundedText, position, workState, receiptState, verifiedOutcome } from 'workforce-presentation';

const root = document.getElementById('titan-workforce');
const role = root.dataset.role;
let controller;
let tab = 'Roster';
let selectedAgent = null;
let workFilter = 'all';
const node = (tag, text, attrs = {}) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = boundedText(text);
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
  return element;
};
const button = (text, action, disabled = false) => {
  const element = node('button', text, { type: 'button' });
  element.disabled = disabled; element.addEventListener('click', action); return element;
};
const panel = title => { const element = node('section', undefined, { class: 'panel' }); element.append(node('h2', title)); return element; };
function fields(parent, values) {
  const dl = node('dl');
  for (const [key, value] of Object.entries(values)) { dl.append(node('dt', key), node('dd', Array.isArray(value) ? value.join(', ') || 'None supplied' : value ?? 'Not supplied')); }
  parent.append(dl);
}
function table(parent, headers, rows) {
  if (!rows.length) { parent.append(node('p', 'No records supplied by the hosted Workforce.', { class: 'muted' })); return; }
  const element = node('table'); const head = node('thead'); const hr = node('tr');
  for (const header of headers) hr.append(node('th', header, { scope: 'col' }));
  head.append(hr); element.append(head); const body = node('tbody');
  for (const row of rows) { const tr = node('tr'); for (const value of row) { const td = node('td'); if (value instanceof Node) td.append(value); else td.textContent = boundedText(value); tr.append(td); } body.append(tr); }
  element.append(body); parent.append(element);
}
function unavailable(parent, facet) { parent.append(node('p', `${facet} is not supplied by the current hosted API. No local substitute is created.`, { class: 'notice' })); }
function evidence(parent, refs) {
  const list = node('ul');
  for (const ref of refs ?? []) list.append(node('li', ref));
  if (!list.children.length) parent.append(node('p', 'No evidence references supplied.'));
  else parent.append(list);
}
function render(state) {
  root.replaceChildren();
  const header = node('header'); const identity = node('div');
  identity.append(node('span', 'Business Node · Workforce', { class: 'eyebrow' }), node('h1', 'Titan Workforce'));
  header.append(identity, button('Reconnect / refresh', () => controller.connect(), state.phase === 'submitting'));
  root.append(header);
  const live = node('p', state.phase === 'ready' ? (state.error ?? 'Current hosted projection') : state.phase === 'submitting' ? 'Submitting governed request…' : state.phase === 'loading' ? 'Loading current company context…' : state.error, { role: 'status', 'aria-live': 'polite' });
  root.append(live);
  if (!state.context) return;
  const context = panel('Current company');
  fields(context, { Company: state.context.company_id, Actor: state.context.actor_id, 'DirectAdmin role (presentation only)': role, 'Execution authority': 'Re-evaluated by the canonical host for every request' }); root.append(context);
  const nav = node('nav', undefined, { 'aria-label': 'Workforce views' });
  for (const title of ['Roster', 'Organisation', 'Work', 'Controls', 'Evidence', 'Health']) {
    const item = button(title, () => { tab = title; render(controller.state); }); item.setAttribute('aria-current', title === tab ? 'page' : 'false'); nav.append(item);
  }
  root.append(nav);
  const workers = state.discovery?.workers ?? [];
  const work = state.status?.work ?? [];
  const view = panel(tab); root.append(view);
  if (tab === 'Roster') {
    table(view, ['Identity', 'Kind / position', 'Status', 'Manager', 'Capabilities'], workers.map(worker => [button(worker.worker_id, () => { selectedAgent = worker.worker_id; render(controller.state); }), position(worker), worker.active ? 'Active' : 'Inactive', worker.manager_id ?? 'Not supplied', (worker.capabilities ?? []).join(', ')]));
    const agent = workers.find(worker => worker.worker_id === selectedAgent);
    if (agent) {
      const detail = panel('Agent / participant detail'); fields(detail, { Identity: agent.worker_id, Company: agent.company_id, Kind: agent.kind, Position: position(agent), Team: agent.team_id, Manager: agent.manager_id, Capabilities: agent.capabilities });
      detail.append(node('p', 'Capability availability does not grant execution authority.', { class: 'notice' }));
      table(detail, ['Current work', 'State', 'Evidence'], work.filter(item => item.assignee === agent.worker_id).map(item => [item.work_id, workState(item.state), (item.evidence_refs ?? []).join(', ')]));
      unavailable(detail, 'Operation-specific trust, approved knowledge references, model/provider bindings and attributable value'); root.append(detail);
    }
  } else if (tab === 'Organisation') {
    // Flat relation table cannot recurse forever on malformed/cyclic upstream hierarchy.
    table(view, ['Participant', 'Kind / position', 'Reports to', 'Team'], workers.map(worker => [worker.worker_id, position(worker), worker.manager_id ?? 'Not supplied', worker.team_id ?? 'Not supplied']));
    unavailable(view, 'Mission overlays, delegation paths and staffing recommendations');
  } else if (tab === 'Work') {
    const label = node('label', 'Filter work'); const filter = node('select');
    for (const [value, text] of [['all', 'All work'], ['active', 'Active'], ['waiting', 'Waiting / blocked'], ['approval', 'Approval needed'], ['verified', 'Verified with evidence'], ['failed', 'Failed / uncertain']]) filter.append(node('option', text, { value }));
    filter.value = workFilter; filter.addEventListener('change', () => { workFilter = filter.value; render(controller.state); }); label.append(filter); view.append(label);
    const filtered = work.filter(item => workFilter === 'all' ||
      (workFilter === 'active' && ['CLAIMED', 'IN_PROGRESS', 'RUNNING', 'EXECUTING'].includes(item.state)) ||
      (workFilter === 'waiting' && ['CREATED', 'READY', 'BLOCKED', 'WAITING', 'WAITING_EXTERNAL', 'WAITING_TOOL', 'WAITING_USER', 'SUSPENDED'].includes(item.state)) ||
      (workFilter === 'approval' && item.state === 'WAITING_APPROVAL') ||
      (workFilter === 'verified' && verifiedOutcome(item)) ||
      (workFilter === 'failed' && ['FAILED', 'DENIED', 'UNKNOWN', 'EXPIRED'].includes(item.state)));
    table(view, ['Work / run', 'Objective', 'Agent', 'State', 'Context / evidence'], filtered.map(item => [item.work_id + (item.run_id ? ` / ${item.run_id}` : ''), item.objective, item.assignee ?? 'Unassigned', workState(item.state), [...(item.context_refs ?? []), ...(item.evidence_refs ?? [])].join(', ')]));
    view.append(node('p', 'Run completion and provider acknowledgement are separate from verified business outcomes.', { class: 'notice' }));
  } else if (tab === 'Controls') {
    renderControls(view, state, workers, work);
  } else if (tab === 'Evidence') {
    if (state.receipt) {
      fields(view, { 'Receipt state': receiptState(state.receipt), 'Receipt ID': state.receipt.receipt_id, 'Operation ID': state.receipt.operation_id, 'Correlation ID': state.receipt.correlation_id, 'Work ID': state.receipt.work_id, 'Run ID': state.receipt.run_id, 'Decision ID': state.receipt.decision_id });
      evidence(view, state.receipt.evidence_refs);
    } else view.append(node('p', 'Submit a permitted governed request to inspect its receipt.'));
    for (const item of work.filter(item => item.evidence_refs?.length)) { const row = node('details'); row.append(node('summary', item.work_id)); evidence(row, item.evidence_refs); view.append(row); }
  } else if (tab === 'Health') {
    fields(view, { 'Projection source': state.metadata?.source, 'Last successful refresh': state.metadata?.freshness, 'Runtime status': state.status?.runtime_status ?? 'Not supplied' });
    evidence(view, state.metadata?.evidence_refs);
    const route = role === 'admin' ? 'CMD_PLUGINS_ADMIN' : role === 'reseller' ? 'CMD_PLUGINS_RESELLER' : 'CMD_PLUGINS';
    view.append(node('a', 'Open Operations for node / provider diagnostics', { href: `/${route}/titan_operations` }));
    unavailable(view, 'Capacity, provider health and evidence freshness metrics');
  }
  if (state.receipt && tab !== 'Evidence') {
    const receipt = panel('Latest receipt'); receipt.append(node('p', receiptState(state.receipt)), button('Inspect receipt / evidence', () => { tab = 'Evidence'; render(controller.state); })); root.append(receipt);
  }
}
function renderControls(view, state, workers, work) {
  view.append(node('p', 'Requests are proposals to the governed host. Role, capability availability and trust do not authorize execution.'));
  // Only the exact host-published allowlist can expose a control. Never raw shell or generic JSON.
  const supported = new Set(['pause', 'resume', 'cancel', 'reassign', 'escalate', 'revoke']);
  const actions = (state.discovery?.controls ?? []).filter(item => supported.has(item.action) && typeof item.capability_id === 'string' &&
    (item.action !== 'reassign' || (item.capability_id === 'titan.workforce.reassign' &&
      item.requires_fresh_approval === true && item.grants_authority === false))).map(item => item.action);
  if (!actions.length) {
    if (Array.isArray(state.discovery?.controls) && state.discovery.controls.length === 0) {
      view.append(node('p', 'This is a read-only Workforce projection. The canonical owner has not exposed an authorized lifecycle control; no request was sent.', { class: 'notice', role: 'status' }));
    } else unavailable(view, 'Governed lifecycle controls');
    return;
  }
  const form = node('form');
  const select = (label, options) => { const wrapper = node('label', label); const input = node('select'); for (const [value, text] of options) input.append(node('option', text, { value })); wrapper.append(input); form.append(wrapper); return input; };
  const action = select('Operation', actions.map(value => [value, value]));
  const target = select('Work item', []);
  const worker = select('Target participant', []);
  const label = node('label', 'Reason'); const reason = node('textarea', undefined, { required: '', maxlength: '2000', rows: '3' }); label.append(reason); form.append(label);
  const send = node('button', 'Submit governed request', { type: 'submit', class: 'primary' }); send.disabled = state.phase !== 'ready' || !work.length || Boolean(state.error); form.append(send);
  const hint = node('p', '', { class: 'muted', role: 'status' });
  const replaceOptions = (selectElement, options, emptyLabel) => {
    const selected = selectElement.value;
    selectElement.replaceChildren(node('option', emptyLabel, { value: '' }));
    for (const [value, text] of options) selectElement.append(node('option', text, { value }));
    if (options.some(([value]) => value === selected)) selectElement.value = selected;
    else selectElement.value = options[0]?.[0] ?? '';
  };
  const refreshChoices = () => {
    const reassignment = action.value === 'reassign';
    const workChoices = work.filter(item => !reassignment || item.state === 'READY');
    replaceOptions(target, workChoices.map(item => [item.work_id, item.work_id]),
      reassignment ? 'No READY work available' : 'No work available');
    const selectedWork = workChoices.find(item => item.work_id === target.value);
    const required = selectedWork?.required_capabilities;
    const validRequirements = required === undefined || (Array.isArray(required) &&
      required.every(capability => typeof capability === 'string' && capability.trim()));
    const workerChoices = workers.filter(item => !reassignment ||
      (item.active === true && item.worker_id !== selectedWork?.assignee && validRequirements &&
        (!Array.isArray(required) || required.every(capability => (item.capabilities ?? []).includes(capability)))));
    replaceOptions(worker, workerChoices.map(item => [item.worker_id, item.worker_id]), 'No eligible participant available');
    if (!reassignment) worker.value = '';
    target.required = reassignment;
    worker.required = reassignment;
    hint.textContent = reassignment
      ? 'Reassignment applies to READY work. The request includes the currently projected assignee; the hosted owner rechecks assignment, target eligibility, authority and fresh approval.'
      : '';
    send.disabled = state.phase !== 'ready' || Boolean(state.error) || !workChoices.length ||
      (reassignment && (!selectedWork || !workerChoices.length || !worker.value));
  };
  action.addEventListener('change', refreshChoices);
  target.addEventListener('change', refreshChoices);
  refreshChoices();
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!reason.value.trim() || (action.value === 'reassign' && (!target.value || !worker.value))) return;
    void controller.submit({ action: action.value, work_id: target.value,
      target_worker_id: worker.value || undefined, reason: reason.value.trim() });
  }); view.append(form, hint);
}

// #1049 owns the real session, CSRF/origin protection, expiry and cross-plugin invalidation.
// Commissioned authenticated HTML supplies this nonce; a DA role/environment never supplies identity.
async function start() {
  let relayFetch;
  try {
    // #812 owns the DirectAdmin RAW parser and fetch adapter. Keep this fixed,
    // same-origin module path; do not copy its CGI parsing or proxy behavior here.
    const relay = await import('/CMD_PLUGINS/titan-server-node/images/directadmin-relay-client.mjs');
    if (typeof relay.createDirectAdminRelayFetch !== 'function') throw new Error('directadmin-relay-adapter-invalid');
    relayFetch = relay.createDirectAdminRelayFetch();
    if (typeof relayFetch !== 'function') throw new Error('directadmin-relay-fetch-invalid');
  } catch {
    root.replaceChildren(
      node('h1', 'Titan Workforce'),
      node('p', 'DirectAdmin Workforce relay is unavailable. Install or restore the Titan Server Node plugin, then reconnect.', { role: 'status', 'aria-live': 'polite' }),
    );
    return;
  }
  // #1049 owns session, CSRF, expiry and cross-plugin invalidation. Authenticated
  // host HTML supplies the nonce; the Workforce role/CGI process never does.
  const session = new SDK.DirectAdminCockpitSession(
    () => document.querySelector('meta[name="titan-directadmin-csrf"]')?.getAttribute('content') ?? '',
    relayFetch,
  );
  controller = new WorkforceController(new WorkforceApi(session), render);
  session.subscribe(() => controller.invalidate());
  window.addEventListener('pagehide', () => session.invalidate());
  window.addEventListener('pageshow', event => { if (event.persisted) void controller.connect(); });
  window.addEventListener('titan-context-changed', () => { session.invalidate(); void controller.connect(); });
  void controller.connect();
}
void start();
