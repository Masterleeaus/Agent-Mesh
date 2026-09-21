-- Agent 2 Pass 12: completion evidence/signature convergence.
ALTER TABLE visit_media DROP CONSTRAINT IF EXISTS visit_media_category_check;
ALTER TABLE visit_media ADD CONSTRAINT visit_media_category_check
  CHECK (category IN ('before', 'after', 'receipt', 'assessment', 'signature'));
