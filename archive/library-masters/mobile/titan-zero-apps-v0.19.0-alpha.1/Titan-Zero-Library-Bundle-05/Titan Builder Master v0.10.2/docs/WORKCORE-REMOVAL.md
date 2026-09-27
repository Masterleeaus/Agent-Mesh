# WorkCore Removal

Titan Builder v0.8 removes WorkCore from active runtime and active packaged Builder resources. CRM is the target business operating system.

## Classification

- **ACTIVE_RUNTIME:** zero WorkCore references after cutover, except the compatibility migrator which recognizes legacy tokens but never calls WorkCore.
- **ACTIVE_RESOURCE:** zero WorkCore references in `resources/builder`; templates, blocks, pages, specs, actions, data sources, TitanShell schema/navigation and all ten vertical packs were cut over.
- **TEST_SENTINEL:** tests intentionally contain legacy strings to prove they are rejected or migrated deterministically.
- **DONOR_REFERENCE:** `donor/chatbot-coupled` and `docs/donor` retain historical donor text and are not loaded by the active service provider/registry.
- **HISTORICAL_DOCUMENTATION:** prior changelogs/plans may mention WorkCore to describe earlier architecture.

`LegacyBusinessSpecMigrator` maps only deterministic v0.7 values: customer create, work-order create/assign/task complete and known read-model IDs. Ambiguous property/inventory actions are removed and marked `migration_review_required`; they are never silently guessed.
