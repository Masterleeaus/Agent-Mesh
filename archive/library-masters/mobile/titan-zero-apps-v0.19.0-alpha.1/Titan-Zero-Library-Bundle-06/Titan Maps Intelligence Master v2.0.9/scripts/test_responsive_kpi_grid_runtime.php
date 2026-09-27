<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$view = $root . '/resources/views/user/navigation.blade.php';
$source = file_get_contents($view);
if ($source === false) {
    fwrite(STDERR, "FAIL: unable to read navigation view\n");
    exit(1);
}

$failures = [];

if (str_contains($source, 'class="col-6 col-lg"')) {
    $failures[] = 'KPI cards still use auto-width col-lg, which can compress all metrics into one row.';
}

if (!str_contains($source, 'class="col-6 col-md-4 col-lg-3 col-xxl-2"')) {
    $failures[] = 'KPI cards are missing explicit responsive column widths.';
}

if (!str_contains($source, 'data-titan-maps-kpi-grid')) {
    $failures[] = 'KPI grid is missing its regression-test hook.';
}

if (!str_contains($source, 'data-titan-maps-kpi-label')) {
    $failures[] = 'KPI labels are missing their safe-wrap hook.';
}

if ($failures !== []) {
    foreach ($failures as $failure) {
        fwrite(STDERR, "FAIL: {$failure}\n");
    }
    exit(1);
}

echo "PASS: Maps KPI grid uses bounded responsive columns and safe label wrapping.\n";
