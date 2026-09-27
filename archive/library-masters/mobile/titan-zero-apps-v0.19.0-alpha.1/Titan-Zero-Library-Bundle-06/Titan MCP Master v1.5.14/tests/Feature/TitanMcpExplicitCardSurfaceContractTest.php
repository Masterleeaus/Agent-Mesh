<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$view = (string) file_get_contents($root.'/resources/views/admin/overview.blade.php');
$css = (string) file_get_contents($root.'/resources/assets/css/admin-overview.css');

foreach ([
    'titan-mcp-overview',
    'titan-mcp-card',
    'bg-card-background',
    'text-card-foreground',
    'border-card-border',
] as $needle) {
    if (!str_contains($view, $needle)) {
        fwrite(STDERR, "Missing host-theme card markup contract: {$needle}\n");
        exit(1);
    }
}

foreach ([
    '.titan-mcp-overview .titan-mcp-card',
    'border-width:',
    'border-style:',
    'border-radius:',
    'box-shadow:',
] as $needle) {
    if (!str_contains($css, $needle)) {
        fwrite(STDERR, "Missing external card structure contract: {$needle}\n");
        exit(1);
    }
}

if (substr_count($view, 'titan-mcp-card') < 12) {
    fwrite(STDERR, "Overview does not apply the explicit card surface to enough panels\n");
    exit(1);
}

if (str_contains($view, '<style')) {
    fwrite(STDERR, "Overview must not depend on inline card CSS\n");
    exit(1);
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

echo "Titan MCP host-theme card surface contract PASS\n";
