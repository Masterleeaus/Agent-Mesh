-- Pass 24: MySQL/MariaDB parity for capture-backed owner promise action items.

ALTER TABLE action_items
  ADD COLUMN source_capture_id CHAR(36) NULL AFTER resolved_by,
  ADD UNIQUE KEY uq_action_items_source_capture (source_capture_id),
  ADD KEY idx_action_items_source_capture (source_capture_id),
  ADD CONSTRAINT fk_action_items_source_capture
    FOREIGN KEY (source_capture_id) REFERENCES capture_evidence(id) ON DELETE SET NULL;
