<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$nav = (string) file_get_contents($root.'/System/Navigation/TitanMcpNavigation.php');
$sync = (string) file_get_contents($root.'/System/Mcp/Support/TitanMcpMenuSynchronizer.php');
$view = (string) file_get_contents($root.'/resources/views/admin/overview.blade.php');
$css = (string) file_get_contents($root.'/resources/assets/css/admin-overview.css');

foreach (['Backups and Recovery', 'Access and Permissions'] as $label) {
    if (!str_contains($nav, $label) || !str_contains($sync, $label)) {
        fwrite(STDERR, "Missing ampersand-free MCP menu label: {$label}\n");
        exit(1);
    }
}

foreach ([$nav, $sync] as $source) {
    if (preg_match("/'label'\\s*=>\\s*'[^']*&[^']*'/", $source) === 1) {
        fwrite(STDERR, "Titan MCP menu label still contains an ampersand\n");
        exit(1);
    }
}

foreach ([
    "route('dashboard.admin.titan-mcp.tools')",
    "route('dashboard.admin.titan-mcp.runtime')",
    "route('dashboard.admin.titan-mcp.backups')",
    "route('dashboard.admin.titan-mcp.audit')",
    "route('dashboard.admin.titan-mcp.permissions')",
    "route('dashboard.admin.titan-mcp.settings')",
] as $route) {
    if (!str_contains($view, $route)) {
        fwrite(STDERR, "Overview is missing themed navigation card route {$route}\n");
        exit(1);
    }
}

if (substr_count($view, 'titan-mcp-card') < 12) {
    fwrite(STDERR, "Overview does not contain enough explicit host-theme card surfaces\n");
    exit(1);
}

foreach (['bg-card-background', 'text-card-foreground', 'border-card-border'] as $required) {
    if (!str_contains($view, $required)) {
        fwrite(STDERR, "Overview is missing host theme class contract: {$required}\n");
        exit(1);
    }
}
if (!str_contains($css, '.titan-mcp-overview .titan-mcp-card')) {
    fwrite(STDERR, "External stylesheet is missing scoped MCP card surface\n");
    exit(1);
}

if (preg_match('/(?:background(?:-color)?|color)\s*:\s*#[0-9a-f]{3,8}/i', $view.$css) === 1) {
    fwrite(STDERR, "Overview hard-codes card colours instead of host theme variables\n");
    exit(1);
}

echo "Titan MCP admin overview theme/menu-label contract PASS\n";
