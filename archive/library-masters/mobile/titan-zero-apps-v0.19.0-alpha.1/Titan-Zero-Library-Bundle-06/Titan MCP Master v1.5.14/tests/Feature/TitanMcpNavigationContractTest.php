<?php

declare(strict_types=1);
$root=dirname(__DIR__,2);
$nav=(string)file_get_contents($root.'/System/Navigation/TitanMcpNavigation.php');
foreach (['Titan MCP','Overview','Tool Catalogue','Runtime Health','Backups and Recovery','Audit Ledger','Access and Permissions','Settings','titan_mcp_overview','titan_mcp_tools','titan_mcp_runtime','titan_mcp_backups','titan_mcp_audit','titan_mcp_permissions','titan_mcp_settings'] as $needle) if(!str_contains($nav,$needle)) { fwrite(STDERR, "Missing navigation contract {$needle}\n"); exit(1); }
$routes=(string)file_get_contents($root.'/routes/admin.php');
foreach (['overview','tools','runtime','backups','audit','permissions','settings','update'] as $needle) if(!str_contains($routes,$needle)) { fwrite(STDERR, "Missing admin route {$needle}\n"); exit(1); }

$sync=(string)file_get_contents($root.'/System/Mcp/Support/TitanMcpMenuSynchronizer.php');
foreach ([
    "'route'=>'dashboard.admin.titan-mcp.overview'",
    "'order'=>996",
    "Schema::hasColumn('menus','is_admin')",
    "'is_admin'=>\$hasAdminDiscriminator?1:null",
] as $needle) {
    if(!str_contains($sync,$needle)) { fwrite(STDERR, "Missing Website1408 Super Admin menu contract {$needle}\n"); exit(1); }
}
if(str_contains($sync,"if(!Schema::hasColumn('menus','is_admin'))")) {
    fwrite(STDERR, "Titan MCP still deletes/abandons menus on Website1408's shared menus table\n"); exit(1);
}

$controller=(string)file_get_contents($root.'/System/Http/Controllers/TitanMcpSettingsController.php');
foreach (['authorizeSuperAdmin','isSuperAdmin'] as $required) {
    if(!str_contains($controller,$required)) { fwrite(STDERR, "Missing strict Super Admin authorization contract {$required}\n"); exit(1); }
}
if(str_contains($controller,'isAdmin')) { fwrite(STDERR, "Ordinary admin authorization fallback remains on Titan MCP management UI\n"); exit(1); }
$superAdminMigration=$root.'/database/migrations/2026_08_18_000004_enforce_titan_mcp_super_admin_only.php';
if(!is_file($superAdminMigration)) { fwrite(STDERR, "Missing Super Admin-only upgrade migration\n"); exit(1); }
$migration=(string)file_get_contents($superAdminMigration);
foreach (["where('name','admin')", "where('name','super_admin')", 'role_has_permissions', 'titan_mcp_settings'] as $required) {
    if(!str_contains($migration,$required)) { fwrite(STDERR, "Incomplete Super Admin-only migration contract {$required}\n"); exit(1); }
}
$menuMigration=$root.'/database/migrations/2026_08_18_000005_sync_titan_mcp_website1408_super_admin_menu.php';
if(!is_file($menuMigration)) { fwrite(STDERR, "Missing Website1408 Super Admin menu resync migration\n"); exit(1); }

$uiMigration=$root.'/database/migrations/2026_08_18_000006_refresh_titan_mcp_admin_cards_menu_labels.php';
if(!is_file($uiMigration)) { fwrite(STDERR, "Missing themed Overview/menu-label resync migration\n"); exit(1); }
echo "Titan MCP navigation contract PASS\n";
