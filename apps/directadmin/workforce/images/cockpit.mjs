import * as SDK from 'titan-sdk';
import { WorkforceController } from 'workforce-controller';
import { boundedText, position, workState, receiptState } from 'workforce-presentation';

const root = document.getElementById('titan-workforce');
const role = root.dataset.role;
let tab = 'Roster';
let selectedAgent = null;
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
  const live = node('p', state.phase === 'ready' ? 'Current hosted projection' : state.phase === 'submitting' ? 'Submitting governed request…' : state.phase === 'loading' ? 'Loading current company context…' : state.error, { role: 'status', 'aria-live': 'polite' });
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
    table(view, ['Work / run', 'Objective', 'Agent', 'State', 'Context / evidence'], work.map(item => [item.work_id + (item.run_id ? ` / ${item.run_id}` : ''), item.objective, item.assignee ?? 'Unassigned', workState(item.state), [...(item.context_refs ?? []), ...(item.evidence_refs ?? [])].join(', ')]));
    view.append(node('p', 'Run completion and provider acknowledgement are separate from verified business outcomes.', { class: 'notice' }));
  } else if (tab === 'Controls') {
    renderControls(view, state, workers, work);
  } else if (tab === 'Evidence') {
    if (state.receipt) {
      fields(view, { 'Receipt state': receiptState(state.receipt), 'Operation ID': state.receipt.operation_id, 'Correlation ID': state.receipt.correlation_id, 'Work ID': state.receipt.work_id, 'Run ID': state.receipt.run_id, 'Decision ID': state.receipt.decision_id });
      evidence(view, state.receipt.evidence_refs);
    } else view.append(node('p', 'Submit a permitted governed request to inspect its receipt.'));
    for (const item of work.filter(item => item.evidence_refs?.length)) { const row = node('details'); row.append(node('summary', item.work_id)); evidence(row, item.evidence_refs); view.append(row); }
  } else if (tab === 'Health') {
    fields(view, { 'Projection source': 'Canonical hosted Workforce', 'Last successful refresh': state.status?.observed_at, 'Runtime status': state.status?.runtime_status ?? 'Not supplied' });
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
  const actions = (state.discovery?.controls ?? []).filter(action => supported.has(action));
  if (!actions.length) { unavailable(view, 'Governed lifecycle controls'); return; }
  const form = node('form');
  const select = (label, options) => { const wrapper = node('label', label); const input = node('select'); for (const [value, text] of options) input.append(node('option', text, { value })); wrapper.append(input); form.append(wrapper); return input; };
  const action = select('Operation', actions.map(value => [value, value]));
  const target = select('Work item', work.map(item => [item.work_id, item.work_id]));
  const worker = select('Target participant (reassign / escalate)', [['', 'No target'], ...workers.map(item => [item.worker_id, item.worker_id])]);
  const label = node('label', 'Reason'); const reason = node('textarea', undefined, { required: '', maxlength: '2000', rows: '3' }); label.append(reason); form.append(label);
  const send = node('button', 'Submit governed request', { type: 'submit', class: 'primary' }); send.disabled = state.phase !== 'ready' || !work.length; form.append(send);
  form.addEventListener('submit', event => { event.preventDefault(); if (!reason.value.trim()) return; void controller.submit({ action: action.value, work_id: target.value, target_worker_id: worker.value || undefined, reason: reason.value.trim() }); }); view.append(form);
}

// The real SDK bridge is the only transport. Missing bridge remains fail-closed.
const api = typeof SDK.createDirectAdminWorkforceClient === 'function'
  ? SDK.createDirectAdminWorkforceClient()
  : { context: async () => { throw new Error('shared-sdk-bridge-unavailable'); } };
const controller = new WorkforceController(api, render);
window.addEventListener('pagehide', () => controller.invalidate());
window.addEventListener('titan-context-changed', () => { controller.invalidate(); void controller.connect(); });
void controller.connect();
