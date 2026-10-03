-- New jobs retain the selected Cleaning service, retained job type, setup
-- revision and immutable pricing/recurrence intent. Existing rows stay null.
ALTER TABLE jobs ADD COLUMN service_id TEXT CHECK(service_id IS NULL OR length(trim(service_id)) > 0);
ALTER TABLE jobs ADD COLUMN job_type_id TEXT CHECK(job_type_id IS NULL OR length(trim(job_type_id)) > 0);
ALTER TABLE jobs ADD COLUMN service_setup_revision INTEGER CHECK(service_setup_revision IS NULL OR service_setup_revision > 0);
ALTER TABLE jobs ADD COLUMN service_pricing_snapshot TEXT CHECK(service_pricing_snapshot IS NULL OR (json_valid(service_pricing_snapshot) AND json_type(service_pricing_snapshot) = 'object'));
ALTER TABLE jobs ADD COLUMN service_recurrence_snapshot TEXT CHECK(service_recurrence_snapshot IS NULL OR (json_valid(service_recurrence_snapshot) AND json_type(service_recurrence_snapshot) = 'object'));

CREATE TRIGGER jobs_cleaning_snapshot_insert_complete
BEFORE INSERT ON jobs
WHEN NOT (
  NEW.service_id IS NULL AND NEW.job_type_id IS NULL AND NEW.service_setup_revision IS NULL
  AND NEW.service_pricing_snapshot IS NULL AND NEW.service_recurrence_snapshot IS NULL
  OR NEW.service_id IS NOT NULL AND NEW.job_type_id IS NOT NULL AND NEW.service_setup_revision IS NOT NULL
  AND NEW.service_pricing_snapshot IS NOT NULL AND NEW.service_recurrence_snapshot IS NOT NULL
)
BEGIN
  SELECT RAISE(ABORT, 'cleaning-job-snapshot-incomplete');
END;

CREATE TRIGGER jobs_cleaning_snapshot_update_complete
BEFORE UPDATE OF service_id,job_type_id,service_setup_revision,service_pricing_snapshot,service_recurrence_snapshot ON jobs
WHEN NOT (
  NEW.service_id IS NULL AND NEW.job_type_id IS NULL AND NEW.service_setup_revision IS NULL
  AND NEW.service_pricing_snapshot IS NULL AND NEW.service_recurrence_snapshot IS NULL
  OR NEW.service_id IS NOT NULL AND NEW.job_type_id IS NOT NULL AND NEW.service_setup_revision IS NOT NULL
  AND NEW.service_pricing_snapshot IS NOT NULL AND NEW.service_recurrence_snapshot IS NOT NULL
)
BEGIN
  SELECT RAISE(ABORT, 'cleaning-job-snapshot-incomplete');
END;

CREATE TRIGGER jobs_cleaning_snapshot_immutable
BEFORE UPDATE OF service_id,job_type_id,service_setup_revision,service_pricing_snapshot,service_recurrence_snapshot ON jobs
WHEN NEW.service_id IS NOT OLD.service_id
  OR NEW.job_type_id IS NOT OLD.job_type_id
  OR NEW.service_setup_revision IS NOT OLD.service_setup_revision
  OR NEW.service_pricing_snapshot IS NOT OLD.service_pricing_snapshot
  OR NEW.service_recurrence_snapshot IS NOT OLD.service_recurrence_snapshot
BEGIN
  SELECT RAISE(ABORT, 'cleaning-job-snapshot-immutable');
END;
