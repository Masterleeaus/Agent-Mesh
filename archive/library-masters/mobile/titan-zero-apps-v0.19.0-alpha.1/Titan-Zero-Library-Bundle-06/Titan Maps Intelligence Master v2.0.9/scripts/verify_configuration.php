<?php

declare(strict_types=1);

$root = dirname(__DIR__);

require_once $root.'/Exceptions/MapsIntelligenceException.php';
require_once $root.'/DTO/RankedCandidate.php';
require_once $root.'/DTO/MatchResult.php';
require_once $root.'/Services/PlaceCanonicalizer.php';
require_once $root.'/Services/MapsConfiguration.php';
require_once $root.'/Services/ProviderRankingService.php';
require_once $root.'/Services/CandidateMatchingService.php';

use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Services\CandidateMatchingService;
use App\Extensions\TitanMapsIntelligence\Services\MapsConfiguration;
use App\Extensions\TitanMapsIntelligence\Services\PlaceCanonicalizer;
use App\Extensions\TitanMapsIntelligence\Services\ProviderRankingService;

$base = require $root.'/config/titan_maps_intelligence.php';

$assert = static function (bool $condition, string $message): void {
    if (! $condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
};

$expectConfigFailure = static function (array $config, string $message) use ($assert): void {
    try {
        new MapsConfiguration($config);
    } catch (MapsIntelligenceException) {
        return;
    }
    $assert(false, $message);
};

$distanceConfig = $base;
$distanceConfig['ranking']['weights'] = [
    'distance' => 1.0,
    'category' => 0.0,
    'rating' => 0.0,
    'review_count' => 0.0,
    'open_now' => 0.0,
    'contactability' => 0.0,
    'freshness' => 0.0,
];
$distanceSettings = new MapsConfiguration($distanceConfig);
$distanceRanking = new ProviderRankingService($distanceSettings);
$distanceScore = $distanceRanking->rank([
    'distance_km' => 0.0,
    'category_match' => 0.0,
    'rating' => 0.0,
    'review_count' => 0,
    'open_now' => false,
    'phone' => null,
    'website' => null,
    'data_freshness' => 0.0,
])->score;
$assert(abs($distanceScore - 1.0) < 0.000001, 'ranking must honor configured distance weight');

$categoryConfig = $base;
$categoryConfig['ranking']['weights'] = [
    'distance' => 0.0,
    'category' => 1.0,
    'rating' => 0.0,
    'review_count' => 0.0,
    'open_now' => 0.0,
    'contactability' => 0.0,
    'freshness' => 0.0,
];
$categorySettings = new MapsConfiguration($categoryConfig);
$categoryRanking = new ProviderRankingService($categorySettings);
$categoryScore = $categoryRanking->rank([
    'distance_km' => 0.0,
    'category_match' => 0.0,
    'rating' => 0.0,
    'review_count' => 0,
    'open_now' => false,
    'phone' => null,
    'website' => null,
    'data_freshness' => 0.0,
])->score;
$assert(abs($categoryScore) < 0.000001, 'changing ranking weights must change deterministic score without code edits');

$matchConfig = $base;
$matchConfig['matching']['weights'] = [
    'provider_place_id' => 0.40,
    'phone' => 0.15,
    'domain' => 0.12,
    'email' => 0.08,
    'address' => 0.08,
    'proximity' => 0.06,
    'name' => 0.06,
    'category' => 0.05,
];
$matchConfig['matching']['confirmed_threshold'] = 0.35;
$matchConfig['matching']['ambiguous_threshold'] = 0.20;
$matchSettings = new MapsConfiguration($matchConfig);
$matching = new CandidateMatchingService($matchSettings, new PlaceCanonicalizer());
$result = $matching->score(
    ['provider' => 'google-places', 'provider_place_id' => 'abc'],
    ['external_provider' => 'google-places', 'external_place_id' => 'abc'],
);
$assert(abs($result->score - 0.40) < 0.000001, 'matching must honor configured provider-place weight');
$assert($result->status === 'confirmed', 'matching must honor configured confirmed threshold');

$lowerWeightConfig = $matchConfig;
$lowerWeightConfig['matching']['weights']['provider_place_id'] = 0.20;
$lowerWeightConfig['matching']['weights']['address'] = 0.28;
$lowerWeightSettings = new MapsConfiguration($lowerWeightConfig);
$lowerMatching = new CandidateMatchingService($lowerWeightSettings, new PlaceCanonicalizer());
$lowerResult = $lowerMatching->score(
    ['provider' => 'google-places', 'provider_place_id' => 'abc'],
    ['external_provider' => 'google-places', 'external_place_id' => 'abc'],
);
$assert(abs($lowerResult->score - 0.20) < 0.000001, 'matching score must change when weight configuration changes');
$assert($lowerResult->status === 'ambiguous', 'matching status must change when configured thresholds are crossed');

$assert($distanceSettings->maximumResults() === (int) $base['limits']['maximum_results'], 'maximum_results must come from configuration');
$assert(abs($distanceSettings->maximumRadiusMetres() - (float) $base['limits']['maximum_radius_metres']) < 0.001, 'maximum_radius_metres must come from configuration');
$assert($distanceSettings->maximumProviderPageSize() === (int) $base['limits']['maximum_provider_page_size'], 'provider page size must come from configuration');
$assert($distanceSettings->providerConfig('google-places')['retry_attempts'] === (int) $base['providers']['google-places']['retry_attempts'], 'retry attempts must come from validated provider configuration');
$assert($distanceSettings->version() === (string) $base['configuration_version'], 'configuration version must be exposed for audit metadata');
$assert($distanceSettings->matrixCacheTtlSeconds(true) === (int) $base['travel_matrix']['cache_ttl_seconds'], 'matrix cache TTL must come from configuration');
$assert($distanceSettings->matrixMaximumOrigins() === (int) $base['travel_matrix']['maximum_origins'], 'matrix origin cap must come from configuration');
$assert($distanceSettings->matrixMaximumDestinations() === (int) $base['travel_matrix']['maximum_destinations'], 'matrix destination cap must come from configuration');
$assert($distanceSettings->nearestResourceLimit() === (int) $base['travel_matrix']['nearest_resource_limit'], 'nearest resource limit must come from configuration');

$invalid = $base;
$invalid['ranking']['weights']['distance'] = 0.99;
$expectConfigFailure($invalid, 'invalid ranking weight sum must fail');

$invalid = $base;
$invalid['matching']['ambiguous_threshold'] = 0.90;
$expectConfigFailure($invalid, 'ambiguous threshold above confirmed threshold must fail');

$invalid = $base;
$invalid['limits']['maximum_results'] = 0;
$expectConfigFailure($invalid, 'invalid result cap must fail');

$invalid = $base;
$invalid['providers']['google-places']['timeout_seconds'] = 0;
$expectConfigFailure($invalid, 'invalid provider timeout must fail');

$invalid = $base;
$invalid['providers']['google-places']['retry_attempts'] = 4;
$expectConfigFailure($invalid, 'unsafe provider retries must fail');

$invalid = $base;
$invalid['travel_matrix']['nearest_candidate_pool'] = 5;
$invalid['travel_matrix']['nearest_resource_limit'] = 10;
$expectConfigFailure($invalid, 'nearest candidate pool smaller than result limit must fail');

$assert($distanceSettings->territoryAnalyticsMaximumCells() === (int) $base['territory_analytics']['maximum_cells'], 'territory analytics cell cap must come from configuration');
$assert($distanceSettings->territoryAnalyticsSupplierPool() === (int) $base['territory_analytics']['supplier_pool'], 'territory analytics supplier pool must come from configuration');
$assert($distanceSettings->territoryAnalyticsExpansionWeights() === $base['territory_analytics']['expansion_weights'], 'territory expansion weights must come from configuration');

$invalid = $base;
$invalid['territory_analytics']['expansion_weights']['demand'] = 0.45;
$expectConfigFailure($invalid, 'territory expansion weights must sum to exactly 1');

$invalid = $base;
$invalid['territory_analytics']['maximum_cells'] = 25;
$invalid['territory_analytics']['supplier_pool'] = 25;
$invalid['limits']['maximum_route_matrix_elements'] = 500;
$expectConfigFailure($invalid, 'territory analytics cell/supplier product must respect route matrix quota');

echo "OK: configuration changes deterministically control ranking, matching, territory analytics, limits and provider retry settings\n";
