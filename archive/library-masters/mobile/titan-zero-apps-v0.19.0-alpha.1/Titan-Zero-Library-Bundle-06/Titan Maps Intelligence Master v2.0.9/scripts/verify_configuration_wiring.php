<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$errors = [];

$source = static fn (string $relative): string => (string) file_get_contents($root.'/'.$relative);
$expect = static function (string $relative, string $needle, string $message) use (&$errors, $source): void {
    if (! str_contains($source($relative), $needle)) {
        $errors[] = $message;
    }
};
$reject = static function (string $relative, string $needle, string $message) use (&$errors, $source): void {
    if (str_contains($source($relative), $needle)) {
        $errors[] = $message;
    }
};

$expect('System/TitanMapsIntelligenceServiceProvider.php', 'MapsConfiguration::class', 'service provider must bind/resolve MapsConfiguration');
$expect('Services/MapsCapabilityService.php', 'private readonly MapsConfiguration $configuration', 'AI capability limits must use MapsConfiguration');
$expect('Services/MapsCapabilityService.php', "'maximum_results' => ['type' => 'integer', 'minimum' => 1, 'maximum' => \$this->configuration->maximumResults()]", 'AI capability maximum_results must use configured cap');
$reject('Services/MapsCapabilityService.php', "'maximum' => 50000", 'AI capability radius must not be hard-coded');
$expect('Tools/SearchBusinessesTool.php', 'MapsConfiguration $configuration', 'search tool must receive MapsConfiguration');
$expect('Tools/SearchBusinessesTool.php', 'assertSearchLimits', 'search tool must enforce configured limits');
$expect('Http/Requests/StoreSearchRequest.php', "config('extensions.titan_maps_intelligence.limits.maximum_results'", 'HTTP search validation must use configured result cap');
$expect('Http/Requests/StoreSearchRequest.php', "config('extensions.titan_maps_intelligence.limits.maximum_radius_metres'", 'HTTP search validation must use configured radius cap');
$expect('Jobs/ProcessDiscoveryPage.php', 'MapsConfiguration $configuration', 'paged discovery must receive MapsConfiguration');
$reject('Jobs/ProcessDiscoveryPage.php', 'min(20, $remaining)', 'provider page size must not be hard-coded');
$reject('Jobs/ProcessDiscoveryPage.php', '$distanceKm ?? 25.0', 'ranking missing-distance fallback must not be hard-coded');
$reject('Jobs/ProcessDiscoveryPage.php', '? 0.5', 'uncategorised ranking score must not be hard-coded');
$expect('Providers/GooglePlacesProvider.php', "['page_size']", 'Google Places page size must use validated provider configuration');
$expect('Services/DiscoverySearchService.php', "'configuration_version'", 'search audit metadata must retain configuration version');
$expect('Services/CandidateMatchWorkflow.php', 'configuration->version()', 'candidate match strategy must retain configuration version');

if ($errors !== []) {
    foreach ($errors as $error) {
        fwrite(STDERR, "FAIL: {$error}\n");
    }
    exit(1);
}

echo "OK: operational paths are wired to validated MapsConfiguration\n";
