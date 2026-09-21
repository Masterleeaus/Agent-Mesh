import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const root = process.cwd();
const mod = await import(pathToFileURL(path.join(root, 'packages/.tmp-revenue-journey-build/lead-opportunity-evidence.js')).href);

const provenance = { producer:'crm-sync', source_event_id:'evt-lead-1', observed_at:'2026-09-13T01:30:00Z' };
const ownership = { owner_ref:'user:sales-7', ownership_source_ref:'crm:lead:lead-1', ownership_revision:'rev-7', captured_at:'2026-09-13T01:30:00Z' };

function lead(overrides={}) {
  return mod.buildLeadOpportunityLifecycleEvidence({
    company_id:'co-1', kind:'lead', lead_id:'lead-1', correlation_id:'corr-1',
    from_state:'captured', to_state:'qualifying', provenance, evidence_refs:['crm:event:evt-lead-1'],
    source_domain:'crm.leads', source_ref:'lead:lead-1', ownership_evidence:ownership,
    ...overrides,
  });
}

test('lead evidence binds canonical CRM source, ownership snapshot and legal transition without authority', () => {
  const event = lead();
  assert.equal(event.kind, 'lead');
  assert.equal(event.source.source_domain, 'crm.leads');
  assert.equal(event.ownership.canonical_owner, 'Titan CRM');
  assert.equal(event.ownership.source_of_truth, true);
  assert.equal(event.ownership.projection_owns_truth, false);
  assert.equal(event.transition_evidence.from_state, 'captured');
  assert.equal(event.transition_evidence.to_state, 'qualifying');
  assert.equal(event.governance.ownership_evidence_grants_authority, false);
  assert.equal(event.governance.execution_permitted, false);
  assert.equal(event.governance.may_mutate_entities, false);
});

test('opportunity evidence uses opportunity canonical source and preserves correlation evidence', () => {
  const event = mod.buildLeadOpportunityLifecycleEvidence({
    company_id:'co-1', kind:'opportunity', opportunity_id:'opp-1', lead_id:'lead-1', correlation_id:'corr-1',
    from_state:'proposed', to_state:'open', provenance:{...provenance, source_event_id:'evt-opp-1'}, evidence_refs:['crm:event:evt-opp-1'],
    source_domain:'crm.opportunities', source_ref:'opportunity:opp-1',
    ownership_evidence:{...ownership, ownership_source_ref:'crm:opportunity:opp-1', ownership_revision:'rev-2'},
  });
  assert.equal(event.source.source_domain, 'crm.opportunities');
  assert.equal(event.source.source_event_id, 'evt-opp-1');
  assert.equal(event.transition_evidence.disposition, 'transition_proposed');
  assert.ok(event.revenue_journey_id);
});

test('source-domain drift fails closed instead of re-owning lead or opportunity truth', () => {
  assert.throws(() => lead({source_domain:'revenue-journey'}), /source-domain-mismatch:lead/);
});

test('ownership evidence is explicit and cannot be inferred from identity', () => {
  assert.throws(() => lead({ownership_evidence:{owner_ref:'user:sales-7'}}), /ownership-required/);
  const event = lead();
  assert.equal(event.governance.identity_is_authority, false);
  assert.equal(event.governance.authority_granted, false);
});

test('replay is deterministic while ownership revision or lifecycle transition changes are distinct', () => {
  const a = lead();
  const b = lead();
  assert.equal(mod.assertLeadOpportunityEvidenceReplay(a,b), true);
  const revised = lead({ownership_evidence:{...ownership, ownership_revision:'rev-8'}});
  assert.equal(mod.assertLeadOpportunityEvidenceReplay(a,revised), false);
  assert.throws(() => lead({from_state:'converted', to_state:'qualifying'}), /transition-invalid/);
});
