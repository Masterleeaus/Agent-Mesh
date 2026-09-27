<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$view = (string) file_get_contents($root . '/resources/views/user/navigation.blade.php');
$css = (string) file_get_contents($root . '/resources/css/titan-map-engine.css');
$failures = [];

if (str_contains($view, 'data-titan-maps-kpi-tone=')) {
    $failures[] = 'KPI cards still rotate saturated per-card tones instead of following one host-theme accent.';
}
if (!str_contains($css, 'color: var(--tblr-body-color')) {
    $failures[] = 'KPI labels do not explicitly use the host body text colour for dark/light readability.';
}
if (!str_contains($css, '--titan-maps-kpi-accent: var(--tblr-primary')) {
    $failures[] = 'KPI accent is not anchored to the host primary theme colour.';
}
if (str_contains($css, 'var(--tblr-info') || str_contains($css, 'var(--tblr-success') || str_contains($css, 'var(--tblr-warning') || str_contains($css, 'var(--tblr-danger') || str_contains($css, 'var(--tblr-purple')) {
    $failures[] = 'KPI stylesheet still contains the six-colour rotating palette.';
}
if (!str_contains($css, 'background: var(--tblr-card-bg')) {
    $failures[] = 'KPI cards do not use the host card surface as their authoritative background.';
}
if (!str_contains($css, 'min-height: 96px')) {
    $failures[] = 'KPI cards lost their consistent minimum height.';
}

if ($failures !== []) {
    foreach ($failures as $failure) {
        fwrite(STDERR, "FAIL: {$failure}\n");
    }
    exit(1);
}

echo "PASS: Maps KPI cards use readable host-theme text, one primary accent, and consistent surfaces.\n";
