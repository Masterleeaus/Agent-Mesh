<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$view = (string) file_get_contents($root.'/resources/views/admin/overview.blade.php');
$css = (string) file_get_contents($root.'/resources/assets/css/admin-overview.css');

$fail = [];

if (substr_count($view, 'lqd-card') < 10) {
    $fail[] = 'Overview must use the host lqd-card class for summary, control and runtime cards.';
}

foreach ([
    'Open Tool Catalogue',
    'Open Runtime Health',
    'Open Backups and Recovery',
    'Open Audit Ledger',
    'Open Access and Permissions',
    'Open Settings',
] as $cta) {
    if (!str_contains($view, $cta)) {
        $fail[] = "Missing visible card action: {$cta}";
    }
}

if (substr_count($view, 'btn btn-outline-primary') < 6) {
    $fail[] = 'Overview must expose six visible theme-native card buttons.';
}

foreach ([
    'titan-mcp-card',
    'bg-card-background',
    'text-card-foreground',
    'border-card-border',
] as $required) {
    if (!str_contains($view, $required)) {
        $fail[] = "Overview is missing host-theme card markup: {$required}";
    }
}
foreach ([
    '.titan-mcp-overview .titan-mcp-card',
    'border-width:',
    'border-style:',
    'border-radius:',
    'box-shadow:',
] as $required) {
    if (!str_contains($css, $required)) {
        $fail[] = "External stylesheet is missing visible card structure: {$required}";
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

if ($fail !== []) {
    fwrite(STDERR, implode(PHP_EOL, $fail).PHP_EOL);
    exit(1);
}

echo "Titan MCP v1.5.8 visible host-theme card contract PASS\n";
