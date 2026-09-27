import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  CUSTOMER_CARE_SURFACE_INVENTORY,
  buildCustomerCareExecutionContext,
  validateCustomerCareInventory
} from '../titan-workforce/customer-care/customer-care-inventory.mjs';

const root = path.resolve(import.meta.dirname, '..');
const owners = JSON.parse(fs.readFileSync(path.join(root, 'titan-business-services/canonical-service-owners.json'), 'utf8'));
const allFiles = [];
function walk(dir, prefix = '') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute, rel);
    else allFiles.push(rel.replaceAll('\\', '/'));
  }
}
walk(root);

test('Pass 1 inventory resolves existing canonical owners and surfaces', () => {
  const result = validateCustomerCareInventory({ serviceOwners: owners, availablePaths: allFiles });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.company_boundary_ok, true);
  assert.equal(result.authority_neutral, true);
});

test('Customer Care remains a projection/contribution layer, not domain authority', () => {
  assert.equal(CUSTOMER_CARE_SURFACE_INVENTORY.company_boundary, 'company_id');
  assert.equal(CUSTOMER_CARE_SURFACE_INVENTORY.authority_rule, 'identity_does_not_grant_authority');
  assert.equal(CUSTOMER_CARE_SURFACE_INVENTORY.ownership.customer_truth, 'crm');
  assert.equal(CUSTOMER_CARE_SURFACE_INVENTORY.ownership.conversation_execution, 'communications');
  assert.equal(CUSTOMER_CARE_SURFACE_INVENTORY.ownership.job_history, 'jobs_work_orders');
});

test('Customer Care execution context fails closed without company_id and grants no authority', () => {
  assert.throws(() => buildCustomerCareExecutionContext({}), /company_id is required/);
  const context = buildCustomerCareExecutionContext({ company_id: 'co-1', worker_id: 'customer-care-1' });
  assert.deepEqual(context, {
    company_id: 'co-1', actor_user_id: null, worker_id: 'customer-care-1', authority_granted: false, execution_permitted: false
  });
});
