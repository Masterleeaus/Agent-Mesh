-- Agent 4 Local Pass 04 forward-port: communications timeline completeness.
-- The tenant-scoped external-id unique key already exists in migration 015 as
-- uq_comms_account_external_id, so do not create a duplicate equivalent index.
ALTER TABLE communications_log
  ADD KEY idx_comms_account_client_created (account_id, client_id, created_at);
