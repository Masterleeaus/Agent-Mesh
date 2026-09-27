import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const audit = JSON.parse(fs.readFileSync(new URL('../titan-agent/starter-workforce/rebooking/pass01/REBOOKING-CANONICAL-AUDIT.json', import.meta.url), 'utf8'));
const recurrence = fs.readFileSync(new URL('../titan-workforce/handover/investigation-installation-handover.mjs', import.meta.url), 'utf8');
const bridge = fs.readFileSync(new URL('../runtime/workforce-runtime-background.mjs', import.meta.url), 'utf8');
const booking = JSON.parse(fs.readFileSync(new URL('../titan-business-services/workflows/service_booking.json', import.meta.url), 'utf8'));

 test('pass1 identifies existing Titan recurrence authority instead of a parallel store', () => {
  assert.equal(audit.canonical_recurrence_engine.schema, 'titan.workforce.schedule-recurrence.v1');
  assert.match(recurrence, /function buildWorkforceScheduleRecurrence/);
  assert.match(recurrence, /idempotency_key:`workforce-schedule:/);
  assert.match(recurrence, /duplicate_instance_suppressed:true/);
  assert.equal(audit.production_runtime_modified, false);
});

test('canonical recurrence remains company scoped and authority neutral', () => {
  assert.match(recurrence, /legacy-company-boundary/);
  assert.match(recurrence, /requires_fresh_authority_evaluation:true/);
  assert.match(recurrence, /authority_granted:false/);
  assert.match(bridge, /WORKFORCE_SCHEDULE_RECURRENCE_COLLECTION='schedule_recurrence'/);
  assert.equal(audit.protected_hotspots_touched.length, 0);
});

test('rebooking downstream target is existing governed booking workflow', () => {
  assert.equal(booking.wizard.capability, 'crm.appointment.create');
  assert.ok(booking.wizard.governance.required_context.includes('company_id'));
  assert.equal(booking._titan_provenance.company_boundary, 'company_id');
  assert.ok(audit.pass01_findings.some(x => x.area === 'booking_handoff' && x.decision === 'PROPOSE_TO_BOOKING_NOT_DIRECT_EXECUTE'));
});

test('unclear donor licensing prevents direct transplant in pass1', () => {
  assert.equal(audit.donor_reference.license_status, 'UNCLEAR_FROM_CURATED_KIT');
  assert.equal(audit.donor_reference.direct_source_transplant_in_pass01, false);
});
