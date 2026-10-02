#!/usr/bin/env node
/**
 * TASK-128 / Part B T4: reject NEW duplicate db/migrations NNN_ prefixes.
 *
 * Existing collisions on main are grandfathered by exact filename. Never
 * renumber applied files — adding a third file to a frozen prefix, or a
 * second file to a currently unique prefix, fails.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Prefixes that already collide on main. Filenames are frozen. */
export const GRANDFATHERED = {
  100: ["100_booking_request_pricing_mode.sql", "100_comms_log_dedup.sql"],
  137: ["137_accounts_day_review_settings.sql", "137_project_work_order_visit_schema.sql"],
  141: ["141_invoice_source_visit.sql", "141_vehicle_session_capture_method.sql"],
  142: ["142_client_square_customer_fields.sql", "142_invoice_line_item_source_expense.sql"],
  151: ["151_business_pricing_settings.sql", "151_field_completion_evidence.sql"],
  152: ["152_booking_routing_book_work.sql", "152_field_service_report_acknowledgements.sql"],
  153: ["153_booking_request_funnel.sql", "153_communications_outcome_received.sql"],
  162: ["162_expense_commercial_tag.sql", "162_materials_catalog_stats.sql"],
  175: ["175_capture_evidence.sql", "175_push_subscriptions.sql"],
  177: ["177_invoice_kind_progress.sql", "177_workflow_events_reliable_outbox.sql"],
  178: ["178_notification_delivery_reliability.sql", "178_runtime_login_boundary.sql"],
  179: ["179_business_memberships.sql", "179_visit_closeout_kind.sql"],
  180: ["180_complete_job_from_closeout.sql", "180_workforce_skills_availability.sql"],
  181: ["181_expense_allocation_reviewed.sql", "181_field_job_templates.sql"],
  182: ["182_field_service_report_deliveries.sql", "182_rls_estimate_change_order_backfill.sql"],
  183: ["183_rls_subscription_portal_backfill.sql", "183_technician_vehicle_assignments.sql"],
};

export function groupMigrationFiles(filenames) {
  /** @type {Map<string, string[]>} */
  const byPrefix = new Map();
  for (const name of filenames) {
    if (!name.endsWith(".sql")) continue;
    if (name.includes("seed")) continue;
    const match = name.match(/^(\d+)_/);
    if (!match) continue;
    const prefix = match[1];
    const list = byPrefix.get(prefix) ?? [];
    list.push(name);
    byPrefix.set(prefix, list);
  }
  return byPrefix;
}

/**
 * @param {string[]} filenames
 * @param {Record<string, string[]>} grandfathered
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function checkMigrationPrefixes(filenames, grandfathered = GRANDFATHERED) {
  const byPrefix = groupMigrationFiles(filenames);
  const errors = [];

  for (const [prefix, files] of [...byPrefix.entries()].sort(([a], [b]) => Number(a) - Number(b))) {
    const allowed = grandfathered[prefix];
    const sorted = [...files].sort();
    if (allowed) {
      const allowedSorted = [...allowed].sort();
      const extra = sorted.filter((f) => !allowedSorted.includes(f));
      if (extra.length > 0) {
        errors.push(
          `prefix ${prefix} is frozen (${allowedSorted.join(", ")}); new file(s): ${extra.join(", ")}`,
        );
      }
      continue;
    }
    if (sorted.length > 1) {
      errors.push(`prefix ${prefix} collides: ${sorted.join(", ")}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function filenamesFromDir(dir) {
  return fs.readdirSync(dir).filter((name) => name.endsWith(".sql"));
}

function isMain() {
  const self = fileURLToPath(import.meta.url);
  const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
  return path.resolve(self) === invoked;
}

if (isMain()) {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const dir = path.join(repoRoot, "db", "migrations");
  const result = checkMigrationPrefixes(filenamesFromDir(dir));
  if (!result.ok) {
    console.error("Duplicate migration prefixes (TASK-128):");
    for (const err of result.errors) console.error(`  - ${err}`);
    console.error("Claim the next unused number. Never renumber an applied file.");
    process.exit(1);
  }
  console.log("migration prefixes: ok");
}
