-- Add an immutable Cleaning service/setup/pricing/recurrence snapshot to native
-- jobs. Existing rows remain valid and are not backfilled from mutable settings.
ALTER TABLE jobs ADD COLUMN service_id TEXT;
ALTER TABLE jobs ADD COLUMN service_setup_revision INTEGER CHECK(service_setup_revision IS NULL OR service_setup_revision > 0);
ALTER TABLE jobs ADD COLUMN service_pricing_snapshot TEXT CHECK(service_pricing_snapshot IS NULL OR (json_valid(service_pricing_snapshot) AND json_type(service_pricing_snapshot) = 'object'));
ALTER TABLE jobs ADD COLUMN service_recurrence_snapshot TEXT CHECK(service_recurrence_snapshot IS NULL OR (json_valid(service_recurrence_snapshot) AND json_type(service_recurrence_snapshot) = 'object'));
