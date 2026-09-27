<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$errors = [];
$required = [
    'Contracts/SpatialRiskGateway.php',
    'Contracts/SpatialAssuranceGateway.php',
    'Contracts/SpatialAutonomyGateway.php',
    'Contracts/SpatialCommandBusGateway.php',
    'Contracts/SpatialSignalPublisher.php',
    'Contracts/SpatialRewindRecorder.php',
    'Contracts/SpatialKnowledgeGateway.php',
    'DTO/SpatialExecutionContext.php',
    'DTO/SpatialDecisionReceipt.php',
    'Services/SpatialCapabilityPolicyCatalog.php',
];
foreach ($required as $file) {
    if (! is_file($root.'/'.$file)) $errors[] = "missing {$file}";
}

if (is_file($root.'/Services/SpatialCapabilityPolicyCatalog.php')) {
    require_once $root.'/Services/SpatialCapabilityPolicyCatalog.php';
    $catalog = new App\Extensions\TitanMapsIntelligence\Services\SpatialCapabilityPolicyCatalog();
    $requiredPolicyKeys = ['risk_profile','autonomy_requirement','evidence_requirements','offline_policy','reversibility','idempotency_strategy','mutation_class'];
    foreach (['location.geocode','territory.lookup','territory.validate','route.estimate','route.compare','job.travel_context','service_area.check','nearby.search'] as $id) {
        $policy = $catalog->policy($id);
        foreach ($requiredPolicyKeys as $key) if (!array_key_exists($key,$policy)) $errors[] = "{$id} missing {$key}";
    }
}

if ($errors !== []) {
    fwrite(STDERR, "Governed spatial architecture verification FAILED\n - ".implode("\n - ",$errors)."\n");
    exit(1);
}

echo "Governed spatial architecture verification: PASS\n";
