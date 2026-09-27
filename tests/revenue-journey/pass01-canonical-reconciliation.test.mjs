import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const root = process.cwd();
const mod = await import(pathToFileURL(path.join(root, 'packages/.tmp-revenue-journey-build/canonical-reconciliation.js')).href);
const corr = await import(pathToFileURL(path.join(root, 'packages/.tmp-revenue-journey-build/revenue-journey-correlation.js')).href);

function correlation() {
  return corr.buildRevenueJourneyCorrelation({
    company_id: 'co-1',
    correlation_id: 'corr-1',
    lead_id: 'lead-1',
    provenance: { producer: 'test', source_event_id: 'evt-1', observed_at: '2026-09-13T01:00:00Z' }
  });
}

test('canonical owner registry covers lead-to-payment plus continuation stages', () => {
  for (const stage of ['lead','opportunity','quote','booking','job','invoice','payment','repeat','referral']) {
    const owner = mod.getRevenueJourneyCanonicalOwner(stage);
    assert.ok(owner, stage);
    assert.equal(owner.sourceOfTruth, true);
    assert.equal(owner.journeyProjectionOwnsTruth, false);
  }
});

test('reconciliation produces a derived company-scoped projection without domain authority', () => {
  const result = mod.buildRevenueJourneyCanonicalReconciliation({
    company_id: 'co-1', correlation: correlation(), observations: [
      { stage:'lead', entity_id:'lead-1', state:'qualified', source_domain:'crm.leads', source_ref:'lead:lead-1' },
      { stage:'quote', entity_id:'quote-1', state:'issued', source_domain:'crm.quotes', source_ref:'estimate:quote-1' },
      { stage:'job', entity_id:'job-1', state:'scheduled', source_domain:'field.work-orders', source_ref:'work-order:job-1' },
      { stage:'invoice', entity_id:'inv-1', state:'issued', source_domain:'crm.invoices', source_ref:'invoice:inv-1' },
      { stage:'payment', entity_id:'pay-1', state:'settled', source_domain:'finance.payments', source_ref:'payment:pay-1' },
    ]
  });
  assert.equal(result.company_id, 'co-1');
  assert.equal(result.observations.length, 5);
  assert.equal(result.governance.is_derived_projection, true);
  assert.equal(result.governance.owns_domain_truth, false);
  assert.equal(result.governance.may_mutate_domain_records, false);
  assert.equal(result.governance.execution_permitted, false);
});

test('source-domain drift fails closed instead of silently re-owning canonical truth', () => {
  assert.throws(() => mod.buildRevenueJourneyCanonicalReconciliation({
    company_id:'co-1', correlation:correlation(), observations:[
      { stage:'invoice', entity_id:'inv-1', state:'issued', source_domain:'revenue-journey', source_ref:'inv-1' }
    ]
  }), /source-domain-mismatch:invoice/);
});

test('cross-company correlation and legacy company aliases fail closed', () => {
  assert.throws(() => mod.buildRevenueJourneyCanonicalReconciliation({company_id:'co-2', correlation:correlation(), observations:[]}), /cross-company-correlation/);
  assert.throws(() => mod.assertRevenueJourneyCompanyBoundary({company_id:'co-1', account_id:'legacy'}), /legacy-company-boundary-forbidden:account_id/);
});

test('registry reuses current canonical mutation surfaces without granting mutation rights', () => {
  assert.deepEqual(mod.getRevenueJourneyCanonicalOwner('quote').canonicalSurfaces, ['/api/v1/estimates']);
  assert.deepEqual(mod.getRevenueJourneyCanonicalOwner('job').canonicalSurfaces, ['/api/v1/work-orders']);
  assert.deepEqual(mod.getRevenueJourneyCanonicalOwner('invoice').canonicalSurfaces, ['/api/v1/invoices']);
  assert.ok(mod.getRevenueJourneyCanonicalOwner('payment').canonicalSurfaces.includes('/api/v1/invoices/[id]/payments'));
});
