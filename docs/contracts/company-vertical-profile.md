# Company vertical profile selection

## Ownership

- The selected-profile contract and writer live beside the existing `VerticalPackStore` in `packages/titan-platform/src/vertical-pack.ts`.
- Available Cleaning module IDs and versions come from `packages/modules/bundles/cleaning-workforce.bundle.json`; the stored value does not copy bundle content, capabilities, job types, workers, or pack lifecycle records.
- Persistence reuses `companies.settings` in the company-native database from `db/sqlite/company-native/0001_work_orders.sql`. The company database is selected through the existing company placement resolver and physical store lease. No table, registry, settings ledger, or onboarding store is added.
- The generic `packages/settings/control-plane` registry remains the owner of policy preferences. Vertical profile identity and pack selection are module configuration, so this contract does not add a duplicate policy setting.

## Persisted value

The company settings object contains one `vertical_profile` value:

```json
{
  "schema": "titan.company.vertical-profile.v1",
  "company_id": "company-id",
  "revision": 1,
  "profile": {
    "pack_id": "titan.cleaning-workforce-pack",
    "pack_version": "1.0.0",
    "module_id": "titan.workforce.cleaning",
    "module_version": "1.0.0"
  }
}
```

The writer merges this key with existing company settings in one SQLite transaction. It only supplies a default when no profile is saved. A saved profile is retained across reads and logins; a saved Cleaning profile whose bundle/module is stale is reported as stale and left intact. If the Cleaning bundle is unavailable, the writer does not create a default. Malformed profile state fails closed without being overwritten.

Explicit profile changes require the host's authorization callback, the canonical pack owner's availability resolver, and the expected settings revision. A profile setting does not create staff, activate tools, or grant business authority.

## Route composition status

The runtime requires an authenticated `VerifiedCompanyScope` and a SQLite `StorageClient` yielded inside the canonical native company-store consumer; it rejects public-capability scopes and verifies the selected company row exists in the opened database. The consumer matches the current session and lease before and after the operation. Production route composition still needs the #302 session ingress and the #1382 native company-store consumer. Those owners are not changed by this contract, and the current app does not yet call the profile writer from an authenticated first-run route. The focused tests exercise the writer against isolated SQLite company files opened through the company placement resolver; they do not claim browser or production-route completion.
