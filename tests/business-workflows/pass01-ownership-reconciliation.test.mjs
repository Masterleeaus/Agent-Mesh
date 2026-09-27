import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.argv[2] || process.cwd();
const compiled = path.join(root, 'packages/.tmp-business-workflows-build/workflow-ownership.js');
const mod = await import(pathToFileURL(compiled).href);
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const exists = (rel) => fs.existsSync(path.join(root, rel));
const index = readJson('packages/titan-platform/src/ported/titan-business-services/workflows/index.json');
const owners = readJson('packages/titan-platform/src/ported/titan-business-services/canonical-service-owners.json');

const routeFiles = {
  '/api/v1/clients': 'apps/web/app/api/v1/clients/route.ts',
  '/api/v1/estimates': 'apps/web/app/api/v1/estimates/route.ts',
  '/api/v1/booking-requests': 'apps/web/app/api/v1/booking-requests/route.ts',
  '/api/v1/booking-requests/[id]/convert': 'apps/web/app/api/v1/booking-requests/[id]/convert/route.ts',
  '/api/v1/work-orders': 'apps/web/app/api/v1/work-orders/route.ts',
  '/api/v1/estimates/[id]/create-job': 'apps/web/app/api/v1/estimates/[id]/create-job/route.ts',
  '/api/v1/work-orders/[id]/complete': 'apps/web/app/api/v1/work-orders/[id]/complete/route.ts',
  '/api/v1/work-orders/[id]': 'apps/web/app/api/v1/work-orders/[id]/route.ts',
  '/api/v1/invoices': 'apps/web/app/api/v1/invoices/route.ts',
  '/api/v1/invoices/[id]/payments': 'apps/web/app/api/v1/invoices/[id]/payments/route.ts',
  '/api/v1/payments/[id]': 'apps/web/app/api/v1/payments/[id]/route.ts',
};

test('all routed workflows resolve to exactly one canonical ownership contract entry', () => {
  assert.equal(index.company_boundary, 'company_id');
  assert.equal(index.workflows.length, mod.TITAN_BUSINESS_WORKFLOW_OWNERS.length);
  for (const workflow of index.workflows) {
    const owner = mod.getTitanBusinessWorkflowOwner(workflow.id);
    assert.ok(owner, `missing owner for ${workflow.id}`);
    assert.equal(owner.service, workflow.service);
    assert.equal(owner.capability, workflow.capability);
    assert.equal(owner.orchestrationOnly, true);
    assert.equal(owner.executionMustUseCanonicalDomainSurface, true);
  }
});

test('workflow definitions remain routing metadata rather than domain authority', () => {
  for (const workflow of index.workflows) {
    const file = `packages/titan-platform/src/ported/titan-business-services/workflows/${workflow.file}`;
    const doc = readJson(file);
    assert.equal(doc._titan_provenance.company_boundary, 'company_id');
    assert.equal(doc._titan_provenance.copied_without_domain_authority, true);
  }
});

test('canonical owner labels reconcile with the retained canonical service-owner registry', () => {
  const byService = new Map(owners.services.map((entry) => [entry.service, entry]));
  for (const entry of mod.TITAN_BUSINESS_WORKFLOW_OWNERS) {
    const owner = byService.get(entry.service);
    assert.ok(owner, `service owner missing for ${entry.service}`);
    assert.equal(entry.canonicalOwner, owner.canonical_owner);
  }
  assert.equal(owners.rules.no_duplicate_domain_authority, true);
  assert.equal(owners.rules.adapters_and_workforce_do_not_own_domain_truth, true);
});

test('every declared mutation surface is backed by an existing canonical API route', () => {
  for (const entry of mod.TITAN_BUSINESS_WORKFLOW_OWNERS) {
    assert.ok(entry.canonicalMutationSurfaces.length > 0, `${entry.workflowId} has no canonical handoff`);
    for (const surface of entry.canonicalMutationSurfaces) {
      assert.ok(routeFiles[surface], `unknown route mapping ${surface}`);
      assert.ok(exists(routeFiles[surface]), `missing route ${routeFiles[surface]}`);
    }
  }
});

test('ownership snapshot is company-scoped and explicitly authority-neutral', () => {
  const snap = mod.buildTitanBusinessWorkflowOwnershipSnapshot({ companyId: 'company-1', workflowId: 'create_quote_v1' });
  assert.equal(snap.company_id, 'company-1');
  assert.equal(snap.workflow.canonicalOwner, 'Titan CRM');
  assert.equal(snap.authority.workflow_identity_grants_authority, false);
  assert.equal(snap.authority.orchestrator_owns_domain_truth, false);
  assert.equal(snap.authority.canonical_domain_authorization_required, true);
  assert.throws(() => mod.buildTitanBusinessWorkflowOwnershipSnapshot({ companyId: '', workflowId: 'create_quote_v1' }), /workflow-company-id-required/);
  assert.throws(() => mod.buildTitanBusinessWorkflowOwnershipSnapshot({ companyId: 'company-1', workflowId: 'not-real' }), /workflow-owner-unresolved/);
});
