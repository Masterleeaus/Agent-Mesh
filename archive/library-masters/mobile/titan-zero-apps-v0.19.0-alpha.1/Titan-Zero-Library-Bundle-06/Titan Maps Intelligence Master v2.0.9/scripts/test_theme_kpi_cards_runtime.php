<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$viewPath = $root . '/resources/views/user/navigation.blade.php';
$cssPath = $root . '/resources/css/titan-map-engine.css';
$view = file_get_contents($viewPath);
$css = file_get_contents($cssPath);

if ($view === false || $css === false) {
    fwrite(STDERR, "FAIL: unable to read KPI view or stylesheet\n");
    exit(1);
}

$failures = [];

if (!str_contains($view, 'class="card h-100 titan-maps-kpi-card"')) {
    $failures[] = 'KPI metrics are not rendered with the dedicated themed card class.';
}

if (str_contains($view, 'data-titan-maps-kpi-tone=')) {
    $failures[] = 'KPI cards still rotate per-card tones instead of using the host primary theme accent.';
}

if (!str_contains($view, 'data-titan-maps-kpi-value')) {
    $failures[] = 'KPI values are missing their dedicated theme hook.';
}

$linkPosition = strpos($view, '<link rel="stylesheet"');
$mapPayloadIfPosition = strpos($view, '@if ($mapPayload)');
if ($linkPosition === false || ($mapPayloadIfPosition !== false && $mapPayloadIfPosition < $linkPosition)) {
    $failures[] = 'Maps KPI stylesheet is still conditional on map payload instead of loading on every Maps page.';
}

foreach ([
    '.titan-maps-kpi-card',
    '--titan-maps-kpi-accent',
    'var(--tblr-card-bg',
    'var(--tblr-primary',
    'var(--tblr-body-color',
    'color-mix(',
] as $needle) {
    if (!str_contains($css, $needle)) {
        $failures[] = "KPI theme stylesheet missing required theme token: {$needle}";
    }
}

if (str_contains($view, 'style="word-break: normal; overflow-wrap: normal;"')) {
    $failures[] = 'KPI wrapping is still inline instead of owned by the component stylesheet.';
}

if ($failures !== []) {
    foreach ($failures as $failure) {
        fwrite(STDERR, "FAIL: {$failure}\n");
    }
    exit(1);
}

echo "PASS: Maps KPI metrics use persistent theme-aware card surfaces and host theme colours.\n";
