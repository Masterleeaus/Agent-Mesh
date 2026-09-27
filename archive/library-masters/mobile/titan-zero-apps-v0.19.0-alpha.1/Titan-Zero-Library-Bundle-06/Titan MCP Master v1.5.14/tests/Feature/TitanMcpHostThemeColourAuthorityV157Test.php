<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$view = (string) file_get_contents($root.'/resources/views/admin/overview.blade.php');
$css = (string) file_get_contents($root.'/resources/assets/css/admin-overview.css');

$requiredThemeClasses = ['bg-card-background', 'text-card-foreground', 'border-card-border'];
foreach ($requiredThemeClasses as $class) {
    if (!str_contains($view, $class)) {
        fwrite(STDERR, "Missing host theme class: {$class}\n");
        exit(1);
    }
}

$requiredHostTokenBindings = [
    'background-color: hsl(var(--card-background, var(--background)))',
    'color: hsl(var(--card-foreground, var(--foreground)))',
    'border-color: hsl(var(--card-border, var(--border)))',
];
foreach ($requiredHostTokenBindings as $needle) {
    if (!str_contains($css, $needle)) {
        fwrite(STDERR, "Missing host theme variable binding: {$needle}\n");
        exit(1);
    }
}

$forbiddenCustomColourOverrides = [
    'color-mix(',
    '--bs-body-bg',
    '--bs-body-color',
    '!important',
    '#fff',
    '#ffffff',
    '#000',
    '#000000',
    'rgb(',
    'rgba(',
];
foreach ($forbiddenCustomColourOverrides as $needle) {
    if (stripos($css, $needle) !== false) {
        fwrite(STDERR, "Extension stylesheet owns a fixed/custom colour instead of host theme tokens: {$needle}\n");
        exit(1);
    }
}

fwrite(STDOUT, "Titan MCP host theme colour authority: PASS\n");
