<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$css = (string) file_get_contents($root.'/resources/assets/css/admin-overview.css');
$view = (string) file_get_contents($root.'/resources/views/admin/overview.blade.php');

$requiredDirectTokens = [
    'background-color: hsl(var(--card-background, var(--background)))',
    'color: hsl(var(--card-foreground, var(--foreground)))',
    'border-color: hsl(var(--card-border, var(--border)))',
    'border-radius: var(--card-rounded',
    'box-shadow: var(--card-shadow',
];
foreach ($requiredDirectTokens as $needle) {
    if (!str_contains($css, $needle)) {
        fwrite(STDERR, "Missing direct host theme token binding: {$needle}\n");
        exit(1);
    }
}

$requiredClasses = ['bg-card-background', 'text-card-foreground', 'border-card-border'];
foreach ($requiredClasses as $class) {
    if (!str_contains($view, $class)) {
        fwrite(STDERR, "Missing semantic host class fallback: {$class}\n");
        exit(1);
    }
}

$forbidden = [
    'color-mix(',
    '--bs-body-bg',
    '--bs-body-color',
    '#fff',
    '#ffffff',
    '#000',
    '#000000',
    'rgb(',
    'rgba(',
    '!important',
];
foreach ($forbidden as $needle) {
    if (stripos($css, $needle) !== false) {
        fwrite(STDERR, "Found non-host colour fallback in card stylesheet: {$needle}\n");
        exit(1);
    }
}

fwrite(STDOUT, "Titan MCP v1.5.8 direct host theme token binding: PASS\n");
