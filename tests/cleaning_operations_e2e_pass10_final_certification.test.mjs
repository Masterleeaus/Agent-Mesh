import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const runtimePath = new URL('../titan-business-services/runtime/customer-quote-flow.mjs', import.meta.url);
const packetPath = new URL('../Agent Mesh/Builder 1/WORK-PACKET/TZ-NEXT-002.json', import.meta.url);
const certPath = new URL('../diagnostics/operations/cleaning-operations-final-certification-pass10.json', import.meta.url);
const runtime = readFileSync(runtimePath, 'utf8');
const packet = JSON.parse(readFileSync(packetPath, 'utf8'));
const cert = JSON.parse(readFileSync(certPath, 'utf8'));

test('Pass 10 does not change the certified production runtime', () => {
  const sha = createHash('sha256').update(readFileSync(runtimePath)).digest('hex');
  assert.equal(sha, '7c3da12c94f627ced36ee085ac52ae2a2188c7f013c22eb6365b80571019205b');
});

test('all ten Cleaning Operations passes are complete and lane stops', () => {
  assert.equal(packet.passes.length, 10);
  assert.ok(packet.passes.every(p => p.status === 'COMPLETE'));
  assert.equal(packet.status, 'READY_FOR_MANAGER_MERGE');
  assert.equal(packet.final_certification.stop_lane, true);
});

test('company_id remains the sole supported company boundary', () => {
  assert.match(runtime, /company_id is required/);
  assert.match(runtime, /rejects legacy tenant boundaries/);
  assert.match(runtime, /tenant_company_id/);
  assert.equal(packet.final_certification.company_boundary, 'company_id only');
});

test('execution authority is not granted by the Cleaning Operations bridge', () => {
  assert.match(runtime, /execution_authority:\s*false/);
  assert.match(runtime, /grants_authority:\s*false/);
  assert.equal(packet.final_certification.authority_change, false);
});

test('final certification preserves scoped regression limitation', () => {
  assert.equal(cert.limitations.full_manager_tree_regression, 'NOT_RUN_BUILDER_DELTA_ENVIRONMENT');
  assert.equal(cert.disposition, 'READY_FOR_MANAGER_MERGE');
});

test('Pass 9 scenario certification remains present in final cumulative delta', () => {
  assert.equal(cert.input_pass09.focused_scenarios, '5/5 PASS');
  assert.equal(cert.input_pass09.pass08_plus_pass09, '13/13 PASS');
  assert.ok(existsSync(new URL('./cleaning_operations_e2e_pass09_complete_scenarios.test.mjs', import.meta.url)));
});

test('temporary canonical dependency stubs are absent from final Builder package tree', () => {
  assert.equal(existsSync(new URL('../titan-workforce', import.meta.url)), false);
});
