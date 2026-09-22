import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTitanWarranty,
  buildTitanWarrantyClaim,
  deriveWarrantyLifecycleState,
  remainingWarrantyCoverageCents,
} from '../.test-dist/warranty.js';

const provenance = {
  source: 'fieldservicepro-donor-convergence',
  recorded_at: '2026-09-22T00:00:00.000Z',
  idempotency_key: 'warranty-1',
};

test('warranty uses company_id and remains non-authoritative', () => {
  const warranty = buildTitanWarranty({
    warranty_id: 'w-1', company_id: 'company-1', source_job_id: 'job-1',
    client_id: 'client-1', asset_id: 'asset-1', title: 'Heat pump coverage',
    coverage_type: 'parts_and_labor', start_date: '2026-01-01', end_date: '2027-01-01',
    max_claim_value_cents: 100000, provenance,
  }, { as_of: '2026-09-22' });
  assert.equal(warranty.lifecycle_state, 'active');
  assert.equal(warranty.grants_authority, false);
  assert.equal(warranty.execution_permitted, false);
  assert.equal(warranty.automatic_warranty_creation, false);
  assert.equal(warranty.automatic_job_creation, false);
  assert.equal(warranty.automatic_change_order_creation, false);
});

test('legacy tenant boundaries fail closed', () => {
  assert.throws(() => buildTitanWarranty({
    warranty_id: 'w-1', company_id: 'company-1', source_job_id: 'job-1',
    client_id: 'client-1', title: 'Coverage', coverage_type: 'labor_only',
    start_date: '2026-01-01', end_date: '2027-01-01', provenance,
    account_id: 'legacy-account',
  }), /legacy tenant boundary/);
});

test('lifecycle and remaining coverage are pure derived values', () => {
  assert.equal(deriveWarrantyLifecycleState({ end_date: '2026-10-01', as_of: '2026-09-22' }), 'expiring_soon');
  assert.equal(deriveWarrantyLifecycleState({ end_date: '2026-09-01', as_of: '2026-09-22' }), 'expired');
  assert.equal(deriveWarrantyLifecycleState({ end_date: '2027-01-01', as_of: '2026-09-22', voided: true }), 'voided');
  assert.equal(remainingWarrantyCoverageCents(100000, 25000), 75000);
  assert.equal(remainingWarrantyCoverageCents(null, 25000), null);
});

test('claim captures cost/evidence but cannot create or approve downstream work', () => {
  const claim = buildTitanWarrantyClaim({
    claim_id: 'claim-1', company_id: 'company-1', warranty_id: 'w-1',
    source_job_id: 'job-2', claim_type: 'parts_and_labor',
    description: 'Compressor failed during coverage', claimed_date: '2026-09-22',
    labor_cost_cents: 20000, parts_cost_cents: 45000,
    evidence_refs: ['evidence/photo-1', 'document/report-1'],
    provenance: { ...provenance, idempotency_key: 'claim-1' },
  });
  assert.equal(claim.total_cost_cents, 65000);
  assert.deepEqual(claim.evidence_refs, ['evidence/photo-1', 'document/report-1']);
  assert.equal(claim.automatic_job_creation, false);
  assert.equal(claim.automatic_change_order_creation, false);
  assert.equal(claim.automatic_approval, false);
  assert.equal(claim.automatic_invoicing, false);
  assert.equal(claim.grants_authority, false);
  assert.equal(claim.execution_permitted, false);
});
