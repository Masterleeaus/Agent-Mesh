CREATE TABLE IF NOT EXISTS agent_runs (
  company_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  state TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  work_id TEXT,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (company_id, run_id)
);
CREATE INDEX IF NOT EXISTS agent_runs_recovery_idx ON agent_runs(company_id,state,updated_at);
CREATE INDEX IF NOT EXISTS agent_runs_conversation_idx ON agent_runs(company_id,conversation_id,updated_at);
