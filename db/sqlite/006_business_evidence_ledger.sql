-- 006_business_evidence_ledger.sql
-- Phase 1 hardening of the canonical evidence table into accepted factual history.
-- Existing evidence rows remain readable; new accepted evidence uses the versioned columns below.

ALTER TABLE evidence ADD COLUMN evidence_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE evidence ADD COLUMN classification TEXT NOT NULL DEFAULT 'factual'
  CHECK (classification IN ('factual','simulated','counterfactual'));
ALTER TABLE evidence ADD COLUMN acceptance_state TEXT NOT NULL DEFAULT 'accepted'
  CHECK (acceptance_state IN ('accepted','rejected'));
ALTER TABLE evidence ADD COLUMN event_type TEXT;
ALTER TABLE evidence ADD COLUMN source_type TEXT;
ALTER TABLE evidence ADD COLUMN source_id TEXT;
ALTER TABLE evidence ADD COLUMN actor_id TEXT;
ALTER TABLE evidence ADD COLUMN agent_id TEXT;
ALTER TABLE evidence ADD COLUMN correlation_id TEXT;
ALTER TABLE evidence ADD COLUMN causation_id TEXT;
ALTER TABLE evidence ADD COLUMN decision_id TEXT;
ALTER TABLE evidence ADD COLUMN authority_decision_id TEXT;
ALTER TABLE evidence ADD COLUMN execution_id TEXT;
ALTER TABLE evidence ADD COLUMN verification_id TEXT;
ALTER TABLE evidence ADD COLUMN projection_version TEXT;
ALTER TABLE evidence ADD COLUMN supersedes_evidence_id TEXT;
ALTER TABLE evidence ADD COLUMN occurred_at TEXT;
ALTER TABLE evidence ADD COLUMN accepted_at TEXT;

CREATE INDEX IF NOT EXISTS idx_evidence_company_event
  ON evidence(company_id,event_type,accepted_at,created_at);
CREATE INDEX IF NOT EXISTS idx_evidence_company_correlation
  ON evidence(company_id,correlation_id);
CREATE INDEX IF NOT EXISTS idx_evidence_company_execution
  ON evidence(company_id,execution_id);
CREATE INDEX IF NOT EXISTS idx_evidence_supersedes
  ON evidence(company_id,supersedes_evidence_id);

-- Accepted factual history is immutable. Corrections/supersession/compensation
-- are represented by linked new evidence, never UPDATE/DELETE.
CREATE TRIGGER IF NOT EXISTS evidence_no_update
BEFORE UPDATE ON evidence BEGIN SELECT RAISE(ABORT,'business-evidence-immutable'); END;
CREATE TRIGGER IF NOT EXISTS evidence_no_delete
BEFORE DELETE ON evidence BEGIN SELECT RAISE(ABORT,'business-evidence-immutable'); END;
