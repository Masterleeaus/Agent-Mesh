-- Preserve append-only evidence for direct mutations while allowing the
-- existing companies ON DELETE CASCADE cleanup to remove a whole company.
-- The marker is inserted transactionally by the parent delete trigger, so a
-- failed cascade rolls it back with the company deletion.
CREATE TABLE IF NOT EXISTS titan_company_delete_cascade_guard (
  company_id TEXT PRIMARY KEY
);

CREATE TRIGGER IF NOT EXISTS companies_evidence_delete_guard
BEFORE DELETE ON companies
BEGIN
  INSERT INTO titan_company_delete_cascade_guard(company_id) VALUES (OLD.id);
END;

DROP TRIGGER IF EXISTS evidence_no_delete;
CREATE TRIGGER evidence_no_delete
BEFORE DELETE ON evidence
WHEN NOT EXISTS (
  SELECT 1 FROM titan_company_delete_cascade_guard WHERE company_id = OLD.company_id
)
BEGIN
  SELECT RAISE(ABORT,'business-evidence-immutable');
END;

CREATE TRIGGER IF NOT EXISTS companies_evidence_delete_guard_cleanup
AFTER DELETE ON companies
BEGIN
  DELETE FROM titan_company_delete_cascade_guard WHERE company_id = OLD.id;
END;
