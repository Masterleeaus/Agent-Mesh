import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkMigrationPrefixes, filenamesFromDir, GRANDFATHERED } from "./check-migration-prefixes.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("current grandfathered sets pass", () => {
  const files = Object.values(GRANDFATHERED).flat();
  files.push("176_something.sql", "177_invoice_kind_progress.sql");
  const result = checkMigrationPrefixes(files);
  assert.equal(result.ok, true, result.errors.join("; "));
});

test("unreconciled migration collisions stay explicit until applied-history review", () => {
  const files = filenamesFromDir(path.join(repoRoot, "db", "migrations"));
  const result = checkMigrationPrefixes(files);
  assert.equal(result.ok, false);
  assert.deepEqual(result.errors, [
    "prefix 151 collides: 151_business_pricing_settings.sql, 151_field_completion_evidence.sql",
    "prefix 152 collides: 152_booking_routing_book_work.sql, 152_field_service_report_acknowledgements.sql",
    "prefix 177 collides: 177_invoice_kind_progress.sql, 177_workflow_events_reliable_outbox.sql",
    "prefix 178 collides: 178_notification_delivery_reliability.sql, 178_runtime_login_boundary.sql",
    "prefix 179 collides: 179_business_memberships.sql, 179_visit_closeout_kind.sql",
    "prefix 180 collides: 180_complete_job_from_closeout.sql, 180_workforce_skills_availability.sql",
    "prefix 181 collides: 181_expense_allocation_reviewed.sql, 181_field_job_templates.sql",
    "prefix 182 collides: 182_field_service_report_deliveries.sql, 182_rls_estimate_change_order_backfill.sql",
    "prefix 183 collides: 183_rls_subscription_portal_backfill.sql, 183_technician_vehicle_assignments.sql",
  ]);
});

test("a new file on a frozen prefix fails", () => {
  const files = [...GRANDFATHERED[175], "175_new_thing.sql"];
  const result = checkMigrationPrefixes(files);
  assert.equal(result.ok, false);
  assert.match(result.errors[0], /prefix 175 is frozen/);
});

test("a second file on a unique prefix fails", () => {
  const result = checkMigrationPrefixes(["178_one.sql", "178_two.sql"]);
  assert.equal(result.ok, false);
  assert.match(result.errors[0], /prefix 178 collides/);
});

test("seed files and unprefixed names are ignored", () => {
  const result = checkMigrationPrefixes(["002_seed_dev.sql", "README.sql", "178_ok.sql"]);
  assert.equal(result.ok, true, result.errors.join("; "));
});
