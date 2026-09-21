CREATE TABLE IF NOT EXISTS estimate_ai_runs (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  estimate_id CHAR(36) NOT NULL,
  provider VARCHAR(64) NOT NULL,
  model VARCHAR(128) NOT NULL,
  request_json JSON NOT NULL,
  response_json JSON NOT NULL,
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX ix_estimate_ai_runs_account_estimate (account_id, estimate_id, created_at),
  INDEX ix_estimate_ai_runs_provider_model (account_id, provider, model)
);
