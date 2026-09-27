# Upgrade v0.7 to v0.8

1. Back up the database and `titan-builder/<company_id>/...` asset storage.
2. Install the v0.8 extension over v0.7 using the MagicAI extension lifecycle.
3. Run normal Laravel migrations. v0.8 reuses the existing nine Builder tables and adds no parallel provisioning database.
4. Bind host capability bridges where installed: CRM (`CrmBusinessConfigurationGateway`), TitanAI (`TitanAiRuntimeGateway`), capability discovery/router, and Titan Mobile consumer integration.
5. Run the legacy spec/template migration review. Deterministic mappings can be applied automatically; any `migration_review_required` result must be reviewed before publishing.
6. Confirm the four surface templates/readiness states and publish new snapshots deliberately.

Existing `customer`, `field` and `owner` surface IDs are preserved. The `onboarding` surface is additive. No company-specific source-code forks are required.

Rollback: restore the v0.7 extension package and database backup if the host integration itself must be reverted. For an individual application configuration, use Builder's immutable snapshot rollback instead of database restoration.
