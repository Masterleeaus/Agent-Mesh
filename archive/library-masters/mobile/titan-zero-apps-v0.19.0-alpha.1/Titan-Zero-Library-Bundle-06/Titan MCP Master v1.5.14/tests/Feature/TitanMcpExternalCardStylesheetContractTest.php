<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$view = (string) file_get_contents($root.'/resources/views/admin/overview.blade.php');
$routes = (string) file_get_contents($root.'/routes/admin.php');
$controller = (string) file_get_contents($root.'/System/Http/Controllers/TitanMcpSettingsController.php');
$cssPath = $root.'/resources/assets/css/admin-overview.css';

if (str_contains($view, '<style')) {
    fwrite(STDERR, "Overview still relies on inline CSS\n");
    exit(1);
}

foreach ([
    "dashboard.admin.titan-mcp.styles",
    "config('titan_mcp.server.version')",
    'rel="stylesheet"',
] as $needle) {
    if (!str_contains($view, $needle)) {
        fwrite(STDERR, "Overview does not load external MCP card stylesheet: {$needle}\n");
        exit(1);
    }
}

if (!str_contains($routes, "->name('styles')")) {
    fwrite(STDERR, "Admin routes do not expose Titan MCP stylesheet route\n");
    exit(1);
}

if (!str_contains($controller, 'public function styles(') || !str_contains($controller, "Content-Type'=>'text/css; charset=UTF-8'")) {
    fwrite(STDERR, "Controller does not serve a same-origin CSS response\n");
    exit(1);
}

if (!is_file($cssPath)) {
    fwrite(STDERR, "External Titan MCP card stylesheet is missing\n");
    exit(1);
}

$css = (string) file_get_contents($cssPath);
foreach ([
    '.titan-mcp-overview .titan-mcp-card',
    'border-width:',
    'border-style:',
    'border-radius:',
    'box-shadow:',
] as $needle) {
    if (!str_contains($css, $needle)) {
        fwrite(STDERR, "External card stylesheet is missing required structural rule: {$needle}\n");
        exit(1);
    }
}

foreach ([
    'background-color: hsl(var(--card-background, var(--background)))',
    'color: hsl(var(--card-foreground, var(--foreground)))',
    'border-color: hsl(var(--card-border, var(--border)))',
] as $requiredHostColour) {
    if (!str_contains($css, $requiredHostColour)) {
        fwrite(STDERR, "External stylesheet is missing direct host theme colour binding: {$requiredHostColour}\n");
        exit(1);
    }
}

foreach (['color-mix(', '--bs-body-bg', '--bs-body-color', '!important', '#fff', '#ffffff', '#000', '#000000', 'rgb(', 'rgba('] as $forbidden) {
    if (stripos($css, $forbidden) !== false) {
        fwrite(STDERR, "External stylesheet uses a non-host/fixed colour fallback: {$forbidden}\n");
        exit(1);
    }
}

echo "Titan MCP external card stylesheet contract PASS\n";
