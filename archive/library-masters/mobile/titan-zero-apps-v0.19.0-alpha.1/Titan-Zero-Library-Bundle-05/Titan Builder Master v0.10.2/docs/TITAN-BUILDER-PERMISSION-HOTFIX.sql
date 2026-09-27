-- Titan Builder v0.9.2 permission bootstrap fallback.
-- Normally the v0.9.2 migration performs this automatically.
-- This SQL registers Builder permissions and role mappings only; the v0.9.2 code
-- also supplies compatibility for existing MagicAI accounts that rely on users.type.

INSERT INTO `permissions` (`name`, `guard_name`, `created_at`, `updated_at`) VALUES
('builder.read', 'web', NOW(), NOW()),
('builder.edit', 'web', NOW(), NOW()),
('builder.publish', 'web', NOW(), NOW()),
('builder.assets.manage', 'web', NOW(), NOW()),
('builder.templates.manage', 'web', NOW(), NOW()),
('builder.admin', 'web', NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = VALUES(`updated_at`);

INSERT IGNORE INTO `role_has_permissions` (`permission_id`, `role_id`)
SELECT p.id, r.id
FROM `permissions` p
JOIN `roles` r ON r.guard_name = 'web'
WHERE p.guard_name = 'web'
  AND p.name IN ('builder.read','builder.edit','builder.publish','builder.assets.manage','builder.templates.manage')
  AND r.name IN ('user','admin','super_admin');

INSERT IGNORE INTO `role_has_permissions` (`permission_id`, `role_id`)
SELECT p.id, r.id
FROM `permissions` p
JOIN `roles` r ON r.guard_name = 'web'
WHERE p.guard_name = 'web'
  AND p.name = 'builder.admin'
  AND r.name IN ('admin','super_admin');
