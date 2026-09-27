<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$provider = $root . '/System/Integration/TitanApps/TitanAppsContributionProvider.php';
$serviceProvider = glob($root . '/System/*ServiceProvider.php')[0] ?? null;
if (!is_file($provider) || !$serviceProvider) { fwrite(STDERR, "Titan Apps integration files missing\n"); exit(1); }
require_once $provider;
$source = file_get_contents($provider);
$sp = file_get_contents($serviceProvider);
$class = 'App\\Extensions\\TitanMcp\\System\\Integration\\TitanApps\\TitanAppsContributionProvider';
$obj = new $class();
$descriptor = $obj->contractDescriptor();
$declaredSurfaces = $descriptor['supported_surfaces'] ?? null;
if (!is_array($declaredSurfaces)) { fwrite(STDERR, "Descriptor supported_surfaces missing
"); exit(1); }
$actualSurfaces = [];
foreach ($obj->contributions() as $contribution) {
    foreach (($contribution['supported_surfaces'] ?? []) as $surface) {
        if (!in_array($surface, $actualSurfaces, true)) { $actualSurfaces[] = $surface; }
    }
}
if ($declaredSurfaces !== $actualSurfaces) { fwrite(STDERR, "Descriptor over/under states contribution surfaces
"); exit(1); }
if (($descriptor['canonical_app_boundary'] ?? null) !== ['zero','go','hub']) { fwrite(STDERR, "Canonical Titan Apps boundary missing
"); exit(1); }

foreach ($obj->contributions() as $c) {
    foreach (($c['supported_surfaces'] ?? []) as $surface) {
        if (!in_array($surface, ['zero','go','hub'], true)) { fwrite(STDERR, "Non-canonical app surface: $surface\n"); exit(1); }
    }
    if (($c['executable_ui'] ?? true) !== false || ($c['grants_authority'] ?? true) !== false) { fwrite(STDERR, "Contribution violates authority/UI boundary\n"); exit(1); }
    if (($c['action_semantics'] ?? null) !== 'intent_only' || ($c['execution_boundary'] ?? null) !== 'governed_capability') { fwrite(STDERR, "Contribution action boundary is not governed intent-only\n"); exit(1); }
    if (!isset($c['fallback_behavior'], $c['sensitivity'], $c['risk_classification'])) { fwrite(STDERR, "Contribution metadata incomplete\n"); exit(1); }
}
foreach (['TitanInterfaceRuntime\\', 'TitanInteractionEngine\\'] as $privateImport) {
    if (str_contains($source, 'use App\\Extensions\\' . $privateImport)) { fwrite(STDERR, "Private Titan Apps implementation import found\n"); exit(1); }
}
if (!str_contains($sp, 'titan-apps.interface-contributions.titan-mcp')) { fwrite(STDERR, "Provider contribution is not runtime registered\n"); exit(1); }
fwrite(STDOUT, "Titan Apps convergence contract OK\n");
