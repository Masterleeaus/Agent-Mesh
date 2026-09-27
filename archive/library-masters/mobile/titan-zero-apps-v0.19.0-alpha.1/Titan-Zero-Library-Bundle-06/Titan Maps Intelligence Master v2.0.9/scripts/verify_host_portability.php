<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$failures = [];
$provider = (string) @file_get_contents($root.'/System/TitanMapsIntelligenceServiceProvider.php');
$api = (string) @file_get_contents($root.'/routes/api.php');

if (preg_match('/^use App\\\\Titan\\\\Maps\\\\/m', $provider) === 1) {
    $failures[] = 'Provider still imports hard host-specific App\\Titan\\Maps classes.';
}
if (str_contains($api, 'use App\\Titan\\Maps\\MapsExportController;')) {
    $failures[] = 'API routes still hard-import host MapsExportController.';
}

$requiredFallbacks = [
    'Services/RequestAuthorisedCompanyContext.php',
    'Services/GatePermissionAuthorizer.php',
    'Services/EnvironmentSecretResolver.php',
    'Services/LogAuditRecorder.php',
    'Services/LocalCapabilityRegistrar.php',
    'Services/UnavailableWorkCoreGateway.php',
    'Services/LocalPrivateExportStore.php',
    'Http/Controllers/ExportDownloadController.php',
    'Services/AuthenticatedWorkerIdentityResolver.php',
];
foreach ($requiredFallbacks as $file) {
    if (! is_file($root.'/'.$file)) {
        $failures[] = 'Missing host-portability fallback: '.$file;
    }
}

foreach ([
    'AuthorisedCompanyContext::class',
    'PermissionAuthorizer::class',
    'SecretResolver::class',
    'AuditRecorder::class',
    'CapabilityRegistrar::class',
    'WorkCoreCandidateGateway::class',
    'WorkCoreCandidateLookup::class',
    'PrivateExportStore::class',
    'WorkerIdentityResolver::class',
] as $contract) {
    if (! str_contains($provider, $contract)) {
        $failures[] = 'Provider no longer binds required extension contract: '.$contract;
    }
}

if (! str_contains($provider, 'class_exists($hostClass)')) {
    $failures[] = 'Provider does not prefer host adapters conditionally.';
}

if ($failures !== []) {
    fwrite(STDERR, "Host portability verification FAILED\n - ".implode("\n - ", $failures)."\n");
    exit(1);
}

fwrite(STDOUT, "Host portability verification PASS: installer boot has no mandatory App\\Titan\\Maps class dependency and extension-local fallbacks are packaged.\n");
