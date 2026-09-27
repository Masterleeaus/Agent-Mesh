<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$errors = [];
$required = [
    'Contracts/FieldReferenceGateway.php',
    'DTO/FieldReference.php',
    'Models/MapLocation.php',
    'Services/MapLocationService.php',
    'Services/LocationFreshnessPolicy.php',
    'database/migrations/2026_08_10_000100_create_map_locations_table.php',
    'tests/Architecture/LocationDomainContractTest.php',
    'tests/Feature/MapLocationSecurityTest.php',
];
foreach ($required as $path) {
    if (! is_file($root.'/'.$path)) {
        $errors[] = "missing {$path}";
    }
}

$modelPath = $root.'/Models/MapLocation.php';
if (is_file($modelPath)) {
    $source = (string) file_get_contents($modelPath);
    foreach (['company_id', 'reference_type', 'public_reference_id', 'latitude', 'longitude', 'source', 'precision', 'address_fingerprint', 'formatted_address', 'reverse_geocode_metadata', 'coordinates_verified_at'] as $field) {
        if (! str_contains($source, "'{$field}'")) {
            $errors[] = "MapLocation missing {$field}";
        }
    }
}

$migrationPath = $root.'/database/migrations/2026_08_10_000100_create_map_locations_table.php';
if (is_file($migrationPath)) {
    $source = (string) file_get_contents($migrationPath);
    foreach ([
        "Schema::create('map_locations'",
        "unique(['company_id', 'reference_type', 'public_reference_id']",
        "decimal('latitude', 10, 7)",
        "decimal('longitude', 11, 7)",
        "json('reverse_geocode_metadata')",
    ] as $needle) {
        if (! str_contains($source, $needle)) {
            $errors[] = "map_locations migration missing: {$needle}";
        }
    }
}

$provider = (string) @file_get_contents($root.'/System/TitanMapsIntelligenceServiceProvider.php');
foreach (['FieldReferenceGateway::class', 'TitanFieldReferenceGateway::class', 'WorkCoreFieldReferenceGateway::class'] as $needle) {
    if (! str_contains($provider, $needle)) $errors[] = 'FieldReferenceGateway preferred/fallback binding missing '.$needle;
}
if (! str_contains($provider, 'class_exists($fieldProvider)')) {
    $errors[] = 'FieldReferenceGateway does not select Titan Field optionally at runtime';
}

$config = (string) @file_get_contents($root.'/config/titan_maps_intelligence.php');
foreach (['location_freshness', 'geocode_ttl_days', 'manual_ttl_days', 'gps_ttl_minutes'] as $needle) {
    if (! str_contains($config, $needle)) {
        $errors[] = "location freshness config missing {$needle}";
    }
}

$manifest = json_decode((string) @file_get_contents($root.'/extension.manifest.json'), true);
if (! is_array($manifest) || ! in_array('map_locations', $manifest['database']['owned_tables'] ?? [], true)) {
    $errors[] = 'extension.manifest.json does not own map_locations';
}

$contract = json_decode((string) @file_get_contents($root.'/database/schema-contract.json'), true);
if (! is_array($contract) || ! isset($contract['map_locations'])) {
    $errors[] = 'database/schema-contract.json does not declare map_locations';
}

if ($errors !== []) {
    foreach ($errors as $error) {
        fwrite(STDERR, "ERROR: {$error}\n");
    }
    exit(1);
}

echo "OK: canonical location domain contract verified\n";
