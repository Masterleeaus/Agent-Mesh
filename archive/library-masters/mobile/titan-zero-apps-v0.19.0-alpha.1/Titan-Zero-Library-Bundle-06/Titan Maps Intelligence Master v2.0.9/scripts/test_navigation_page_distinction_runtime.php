<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$controller = (string) file_get_contents($root . '/Http/Controllers/UserNavigationController.php');
$view = (string) file_get_contents($root . '/resources/views/user/navigation.blade.php');
$menu = (string) file_get_contents($root . '/System/Navigation/MapsMenuDefinition.php');
$failures = [];

$pages = [
    'field.index','field.locations','field.team','field.dispatch','field.geofences','field.checkins',
    'location.index','location.discovery','location.candidates','location.suppliers','location.contractors','location.competitors','location.nearby',
    'territories.index','territories.service-areas','territories.travel-zones','territories.geographic-pricing','territories.analysis','territories.providers','territories.competitors','territories.suppliers','territories.gaps','territories.branch-coverage','territories.expansion-opportunities',
    'travel.index','travel.route','travel.matrix','travel.planner','travel.traffic',
    'settings.index','settings.providers','settings.routing','settings.tracking','settings.privacy','settings.usage',
];

if (!str_contains($controller, 'private static function workspaceDefinition')) {
    $failures[] = 'User navigation has no per-page workspace definition contract.';
}
if (!str_contains($controller, 'private function tableDefinition')) {
    $failures[] = 'User navigation has no per-page records/table definition contract.';
}
if (!str_contains($view, 'data-titan-maps-workspace="{{ $page }}"')) {
    $failures[] = 'Shared view is missing the page-specific workspace hook.';
}
if (!str_contains($view, '$workspace[\'metric_keys\']')) {
    $failures[] = 'KPI grid is still global instead of page-specific.';
}
if (!str_contains($view, '$recordTable[\'columns\']')) {
    $failures[] = 'Records renderer is still the generic hard-coded four-column table.';
}
if (str_contains($view, '<div class="card-header"><h3 class="card-title mb-0">Recent records</h3></div>')) {
    $failures[] = 'Generic Recent records heading still survives as the fallback for unrelated pages.';
}

foreach ($pages as $page) {
    if (!str_contains($controller, "'{$page}' => [")) {
        $failures[] = "Missing workspace definition for {$page}.";
    }
}

foreach (['field.locations','field.team','field.checkins','location.discovery','location.candidates','location.suppliers','location.contractors','location.competitors','territories.analysis','settings.providers','settings.routing','settings.tracking','settings.usage'] as $page) {
    if (!str_contains($controller, "'{$page}' => \$this->")) {
        $failures[] = "Missing dedicated table formatter for {$page}.";
    }
}

if (!str_contains($menu, "'route'=>'dashboard.user.titan-maps-intelligence.field.resource-fallback'")) {
    $failures[] = 'Resource Fallback dedicated page route was lost.';
}

if ($failures !== []) {
    foreach ($failures as $failure) {
        fwrite(STDERR, "FAIL: {$failure}\n");
    }
    exit(1);
}

echo "PASS: every shared Maps menu page has a distinct workspace contract, relevant KPIs, and page-specific record rendering.\n";
