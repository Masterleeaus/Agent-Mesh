<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$gateway = file_get_contents($root.'/System/Provisioning/EloquentApplicationProvisioningGateway.php');
$contract = file_get_contents($root.'/System/Contracts/ApplicationProvisioningGateway.php');
$mobile = file_get_contents($root.'/System/Mobile/JsonMobileApplicationDefinitionPublisher.php');
$routes = file_get_contents($root.'/routes/api.php');
$controller = file_get_contents($root.'/System/Http/Controllers/ApplicationProvisioningController.php');

$checks = [
    'contract provisioning set' => str_contains($contract, 'provisionApplicationSet('),
    'contract handoff' => str_contains($contract, 'handoff('),
    'gateway provisioning set' => str_contains($gateway, 'function provisionApplicationSet('),
    'gateway handoff' => str_contains($gateway, 'function handoff('),
    'route provisioning set' => str_contains($routes, "/applications/provision"),
    'route handoff' => str_contains($routes, "/applications/handoff"),
    'controller provisioning set' => str_contains($controller, 'function provisionSet('),
    'controller handoff' => str_contains($controller, 'function handoff('),
    'published definition reads application from snapshot' => preg_match("/snapshot.*project.*meta.*application/s", $mobile) === 1,
];

$failed = array_keys(array_filter($checks, static fn (bool $ok): bool => ! $ok));
if ($failed !== []) {
    fwrite(STDERR, "Provisioning/snapshot contract FAILED:\n - ".implode("\n - ", $failed)."\n");
    exit(1);
}

echo "Provisioning/snapshot contract PASS\n";
