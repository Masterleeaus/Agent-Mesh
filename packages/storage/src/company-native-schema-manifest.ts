import type { CompanyNativeSchemaManifest } from "./company-native-schema-attestation.js";

/**
 * Fresh-only bounded profile derived from the native work-order slice already
 * present in db/sqlite/001 and 005. It is deliberately not a complete FSM
 * manifest and it does not certify or migrate an existing mixed store.
 */
export const companyNativeWorkOrdersManifest: CompanyNativeSchemaManifest = Object.freeze({
  format: "titan-company-native-fsm-manifest/v1",
  owner: "COMPANY_NATIVE_FSM",
  profile_id: "native-work-orders-v1",
  schema_version: "company-native-work-orders-v1",
  schema_scope: Object.freeze([
    "companies",
    "clients",
    "properties",
    "jobs",
    "visits",
    "work_orders",
    "work_order_tasks",
  ]),
  source_provenance: Object.freeze([
    Object.freeze({
      path: "db/sqlite/001_canonical.sql",
      sha256: "fde73791fc94d10bb2a5758cb006428cf6ee9d8dca571a65dd30e32e8bdbede9",
      included_objects: Object.freeze(["companies", "clients", "properties", "jobs", "visits"]),
      excluded_objects: Object.freeze([
        "schema_migrations", "users", "decisions", "authority_state", "evidence",
        "operational_events", "communications", "money_entries", "local_queue",
      ]),
      adaptations: Object.freeze([
        "companies is a company-local id/name profile with empty default settings; GLOBAL_REGISTRY placement and verified session remain authoritative",
        "user ids remain opaque references; identity and access are verified by the canonical session boundary",
        "company-scoped composite foreign keys replace references that depended on a shared database",
      ]),
    }),
    Object.freeze({
      path: "db/sqlite/005_work_order_completion.sql",
      sha256: "a295984f85fcdb169a0e2ab91d90abaab4b7eac53e868d829a2f97f440b094ee",
      included_objects: Object.freeze(["work_orders", "work_order_tasks", "visits"]),
      excluded_objects: Object.freeze(["users_company_id", "clients_company_id", "jobs_company_id"]),
      adaptations: Object.freeze([
        "user foreign keys are omitted because identity records are not copied into company stores",
        "visit work-order/job binding uses a company-scoped composite foreign key instead of legacy triggers",
      ]),
    }),
  ]),
  // Filled from the deterministic fresh SQLite initialization fixture; excludes
  // the marker and its applied-migration ledger to avoid a self-referential hash.
  schema_fingerprint_sha256: "fac6361bf74f6d4ebaebe9fd584ee8a05736e125d8b80a723a142d855842e9d2",
  migrations: Object.freeze([
    Object.freeze({
      sequence: 1,
      migration_id: "company-native-fsm/0001-work-orders",
      path: "db/sqlite/company-native/0001_work_orders.sql",
      sha256: "9efd5eafd9af06d0aa0b67b22c064859166956efd9b4d217af611c0e755b3013",
    }),
  ]),
});
