-- Titan Builder v0.9.1 menu registration fallback for the current MagicAI/Titan `menus` schema.
-- Normally the v0.9.1 migration performs this automatically. Run only after v0.9.1 routes are installed.
START TRANSACTION;

INSERT INTO `menus` (`parent_id`,`key`,`route`,`route_slug`,`label`,`icon`,`svg`,`order`,`is_active`,`params`,`type`,`badge`,`extension`,`bolt_menu`,`bolt_background`,`bolt_foreground`,`letter_icon`,`letter_icon_bg`,`created_at`,`updated_at`,`custom_menu`)
VALUES (NULL,'titan_builder','titan-builder.manage.dashboard',NULL,'Titan Builder','tabler-layout-grid',NULL,24,1,'[]','item',NULL,'1',0,NULL,NULL,0,NULL,NOW(),NOW(),0)
ON DUPLICATE KEY UPDATE `parent_id`=VALUES(`parent_id`),`route`=VALUES(`route`),`label`=VALUES(`label`),`icon`=VALUES(`icon`),`order`=VALUES(`order`),`is_active`=1,`updated_at`=NOW();
SET @tb_user_parent := (SELECT `id` FROM `menus` WHERE `key`='titan_builder' LIMIT 1);

INSERT INTO `menus` (`parent_id`,`key`,`route`,`route_slug`,`label`,`icon`,`svg`,`order`,`is_active`,`params`,`type`,`badge`,`extension`,`bolt_menu`,`bolt_background`,`bolt_foreground`,`letter_icon`,`letter_icon_bg`,`created_at`,`updated_at`,`custom_menu`) VALUES
(@tb_user_parent,'titan_builder_overview','titan-builder.manage.dashboard',NULL,'Overview','tabler-layout-dashboard',NULL,1,1,'[]','item',NULL,'1',0,NULL,NULL,0,NULL,NOW(),NOW(),0),
(@tb_user_parent,'titan_builder_projects','titan-builder.manage.projects',NULL,'Projects','tabler-folders',NULL,2,1,'[]','item',NULL,'1',0,NULL,NULL,0,NULL,NOW(),NOW(),0),
(@tb_user_parent,'titan_builder_applications','titan-builder.manage.applications',NULL,'Applications','tabler-device-mobile',NULL,3,1,'[]','item',NULL,'1',0,NULL,NULL,0,NULL,NOW(),NOW(),0),
(@tb_user_parent,'titan_builder_assets','titan-builder.manage.assets',NULL,'Assets','tabler-photo',NULL,4,1,'[]','item',NULL,'1',0,NULL,NULL,0,NULL,NOW(),NOW(),0),
(@tb_user_parent,'titan_builder_brand','titan-builder.manage.brand',NULL,'Brand & Theme','tabler-palette',NULL,5,1,'[]','item',NULL,'1',0,NULL,NULL,0,NULL,NOW(),NOW(),0),
(@tb_user_parent,'titan_builder_integrations','titan-builder.manage.integrations',NULL,'Integrations','tabler-plug-connected',NULL,6,1,'[]','item',NULL,'1',0,NULL,NULL,0,NULL,NOW(),NOW(),0),
(@tb_user_parent,'titan_builder_permissions','titan-builder.manage.permissions',NULL,'Permissions','tabler-shield-lock',NULL,7,1,'[]','item',NULL,'1',0,NULL,NULL,0,NULL,NOW(),NOW(),0),
(@tb_user_parent,'titan_builder_settings','titan-builder.manage.settings',NULL,'Settings','tabler-settings',NULL,8,1,'[]','item',NULL,'1',0,NULL,NULL,0,NULL,NOW(),NOW(),0)
ON DUPLICATE KEY UPDATE `parent_id`=VALUES(`parent_id`),`route`=VALUES(`route`),`label`=VALUES(`label`),`icon`=VALUES(`icon`),`order`=VALUES(`order`),`is_active`=1,`updated_at`=NOW();
SET @tb_apps_parent := (SELECT `id` FROM `menus` WHERE `key`='titan_builder_applications' LIMIT 1);

INSERT INTO `menus` (`parent_id`,`key`,`route`,`route_slug`,`label`,`icon`,`svg`,`order`,`is_active`,`params`,`type`,`badge`,`extension`,`bolt_menu`,`bolt_background`,`bolt_foreground`,`letter_icon`,`letter_icon_bg`,`created_at`,`updated_at`,`custom_menu`) VALUES
(@tb_apps_parent,'titan_builder_hub','titan-builder.manage.application.hub',NULL,'Titan Hub','tabler-users',NULL,1,1,'[]','item',NULL,'1',0,NULL,NULL,0,NULL,NOW(),NOW(),0),
(@tb_apps_parent,'titan_builder_go','titan-builder.manage.application.go',NULL,'Titan Go','tabler-briefcase',NULL,2,1,'[]','item',NULL,'1',0,NULL,NULL,0,NULL,NOW(),NOW(),0),
(@tb_apps_parent,'titan_builder_command','titan-builder.manage.application.command',NULL,'Titan Command','tabler-command',NULL,3,1,'[]','item',NULL,'1',0,NULL,NULL,0,NULL,NOW(),NOW(),0),
(@tb_apps_parent,'titan_builder_onboarding','titan-builder.manage.application.onboarding',NULL,'Titan Onboarding','tabler-directions',NULL,4,1,'[]','item',NULL,'1',0,NULL,NULL,0,NULL,NOW(),NOW(),0)
ON DUPLICATE KEY UPDATE `parent_id`=VALUES(`parent_id`),`route`=VALUES(`route`),`label`=VALUES(`label`),`icon`=VALUES(`icon`),`order`=VALUES(`order`),`is_active`=1,`updated_at`=NOW();

INSERT INTO `menus` (`parent_id`,`key`,`route`,`route_slug`,`label`,`icon`,`svg`,`order`,`is_active`,`params`,`type`,`badge`,`extension`,`bolt_menu`,`bolt_background`,`bolt_foreground`,`letter_icon`,`letter_icon_bg`,`created_at`,`updated_at`,`custom_menu`)
VALUES (NULL,'titan_builder_admin','titan-builder.admin.dashboard',NULL,'Titan Builder','tabler-tool',NULL,33,1,'[]','item',NULL,'1',0,NULL,NULL,0,NULL,NOW(),NOW(),0)
ON DUPLICATE KEY UPDATE `parent_id`=VALUES(`parent_id`),`route`=VALUES(`route`),`label`=VALUES(`label`),`icon`=VALUES(`icon`),`order`=VALUES(`order`),`is_active`=1,`updated_at`=NOW();
SET @tb_admin_parent := (SELECT `id` FROM `menus` WHERE `key`='titan_builder_admin' LIMIT 1);

INSERT INTO `menus` (`parent_id`,`key`,`route`,`route_slug`,`label`,`icon`,`svg`,`order`,`is_active`,`params`,`type`,`badge`,`extension`,`bolt_menu`,`bolt_background`,`bolt_foreground`,`letter_icon`,`letter_icon_bg`,`created_at`,`updated_at`,`custom_menu`) VALUES
(@tb_admin_parent,'titan_builder_admin_overview','titan-builder.admin.dashboard',NULL,'Overview','tabler-layout-dashboard',NULL,1,1,'[]','item',NULL,'1',0,NULL,NULL,0,NULL,NOW(),NOW(),0),
(@tb_admin_parent,'titan_builder_admin_integrations','titan-builder.admin.integrations',NULL,'Integrations','tabler-plug-connected',NULL,2,1,'[]','item',NULL,'1',0,NULL,NULL,0,NULL,NOW(),NOW(),0),
(@tb_admin_parent,'titan_builder_admin_registry','titan-builder.admin.registry',NULL,'Registry','tabler-components',NULL,3,1,'[]','item',NULL,'1',0,NULL,NULL,0,NULL,NOW(),NOW(),0),
(@tb_admin_parent,'titan_builder_admin_verticals','titan-builder.admin.verticals',NULL,'Vertical Packs','tabler-category',NULL,4,1,'[]','item',NULL,'1',0,NULL,NULL,0,NULL,NOW(),NOW(),0),
(@tb_admin_parent,'titan_builder_admin_permissions','titan-builder.admin.permissions',NULL,'Permissions','tabler-shield-lock',NULL,5,1,'[]','item',NULL,'1',0,NULL,NULL,0,NULL,NOW(),NOW(),0),
(@tb_admin_parent,'titan_builder_admin_diagnostics','titan-builder.admin.diagnostics',NULL,'Diagnostics','tabler-stethoscope',NULL,6,1,'[]','item',NULL,'1',0,NULL,NULL,0,NULL,NOW(),NOW(),0),
(@tb_admin_parent,'titan_builder_admin_settings','titan-builder.admin.settings',NULL,'Settings','tabler-settings',NULL,7,1,'[]','item',NULL,'1',0,NULL,NULL,0,NULL,NOW(),NOW(),0)
ON DUPLICATE KEY UPDATE `parent_id`=VALUES(`parent_id`),`route`=VALUES(`route`),`label`=VALUES(`label`),`icon`=VALUES(`icon`),`order`=VALUES(`order`),`is_active`=1,`updated_at`=NOW();

COMMIT;
