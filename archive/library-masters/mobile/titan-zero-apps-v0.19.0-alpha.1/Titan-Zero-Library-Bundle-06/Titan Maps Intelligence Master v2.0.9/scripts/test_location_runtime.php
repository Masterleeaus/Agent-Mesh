<?php

declare(strict_types=1);

$root = dirname(__DIR__);
require $root.'/Exceptions/MapsIntelligenceException.php';
require $root.'/DTO/FieldReference.php';
require $root.'/Contracts/FieldReferenceGateway.php';
require $root.'/Contracts/WorkCoreCandidateLookup.php';
require $root.'/Services/MapsConfiguration.php';
require $root.'/Services/LocationFreshnessPolicy.php';
require $root.'/Services/WorkCoreFieldReferenceGateway.php';

use App\Extensions\TitanMapsIntelligence\Contracts\WorkCoreCandidateLookup;
use App\Extensions\TitanMapsIntelligence\Services\LocationFreshnessPolicy;
use App\Extensions\TitanMapsIntelligence\Services\MapsConfiguration;
use App\Extensions\TitanMapsIntelligence\Services\WorkCoreFieldReferenceGateway;

$records = [
    'valid' => [
        'company_id' => 'company-a',
        'postal_address' => '100 Collins Street, Melbourne VIC 3000',
        'branch_id' => 'branch-1',
        'active' => true,
    ],
    'deleted' => [
        'company_id' => 'company-a',
        'postal_address' => '1 Deleted Street',
        'deleted_at' => '2026-08-10T00:00:00+00:00',
    ],
    'foreign' => [
        'company_id' => 'company-b',
        'postal_address' => '1 Foreign Street',
        'active' => true,
    ],
];

$lookup = new class($records) implements WorkCoreCandidateLookup {
    public function __construct(private array $records) {}
    public function find(string $companyId, string $entityType, string $entityId): ?array
    {
        return $this->records[$entityId] ?? null;
    }
};
$gateway = new WorkCoreFieldReferenceGateway($lookup);

$valid = $gateway->resolve('company-a', 'property', 'valid');
if ($valid === null || $valid->companyId !== 'company-a' || $valid->postalAddress === null) {
    fwrite(STDERR, "ERROR: valid company reference did not resolve\n");
    exit(1);
}
if ($gateway->resolve('company-a', 'property', 'deleted') !== null) {
    fwrite(STDERR, "ERROR: deleted reference resolved\n");
    exit(1);
}
if ($gateway->resolve('company-a', 'property', 'foreign') !== null) {
    fwrite(STDERR, "ERROR: foreign-company reference resolved\n");
    exit(1);
}

$config = require $root.'/config/titan_maps_intelligence.php';
$policy = new LocationFreshnessPolicy(new MapsConfiguration($config));
$now = new DateTimeImmutable('2026-08-10T00:00:00+00:00');
$expectations = [
    ['geocoded', '-29 days', false],
    ['geocoded', '-30 days', true],
    ['manual', '-364 days', false],
    ['manual', '-365 days', true],
    ['gps', '-9 minutes', false],
    ['gps', '-10 minutes', true],
];
foreach ($expectations as [$source, $delta, $expected]) {
    $actual = $policy->isStale($source, $now->modify($delta), $now);
    if ($actual !== $expected) {
        fwrite(STDERR, "ERROR: freshness mismatch for {$source} {$delta}\n");
        exit(1);
    }
}

echo "Location runtime behavior: PASS\n";
