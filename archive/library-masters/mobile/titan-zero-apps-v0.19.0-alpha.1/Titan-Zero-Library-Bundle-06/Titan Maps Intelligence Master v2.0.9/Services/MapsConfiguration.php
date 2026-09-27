<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;

final class MapsConfiguration
{
    private const RANKING_WEIGHT_KEYS = [
        'distance', 'category', 'rating', 'review_count', 'open_now', 'contactability', 'freshness',
    ];

    private const MATCHING_WEIGHT_KEYS = [
        'provider_place_id', 'phone', 'domain', 'email', 'address', 'proximity', 'name', 'category',
    ];

    private const DISPATCH_WEIGHT_KEYS = [
        'travel', 'skill', 'availability', 'workload', 'territory', 'continuity', 'urgency',
    ];

    public function __construct(private readonly array $config)
    {
        $this->validate();
    }

    public function version(): string
    {
        return (string) $this->config['configuration_version'];
    }

    public function maximumResults(): int
    {
        return (int) $this->config['limits']['maximum_results'];
    }

    public function maximumRadiusMetres(): float
    {
        return (float) $this->config['limits']['maximum_radius_metres'];
    }

    public function maximumProviderPageSize(): int
    {
        return (int) $this->config['limits']['maximum_provider_page_size'];
    }

    public function maximumRouteMatrixElements(): int
    {
        return (int) $this->config['limits']['maximum_route_matrix_elements'];
    }

    public function rankingWeights(): array
    {
        return $this->config['ranking']['weights'];
    }

    public function rankingDistanceCeilingKm(): float
    {
        return (float) $this->config['ranking']['distance_ceiling_km'];
    }

    public function rankingReviewCountLogCeiling(): float
    {
        return (float) $this->config['ranking']['review_count_log_ceiling'];
    }

    public function rankingMissingDistanceKm(): float
    {
        return (float) $this->config['ranking']['missing_distance_km'];
    }

    public function rankingUncategorisedMatchScore(): float
    {
        return (float) $this->config['ranking']['uncategorised_match_score'];
    }

    public function matchingWeights(): array
    {
        return $this->config['matching']['weights'];
    }

    public function confirmedMatchThreshold(): float
    {
        return (float) $this->config['matching']['confirmed_threshold'];
    }

    public function ambiguousMatchThreshold(): float
    {
        return (float) $this->config['matching']['ambiguous_threshold'];
    }

    public function addressSimilarityThreshold(): float
    {
        return (float) $this->config['matching']['address_similarity_threshold'];
    }

    public function nameSimilarityThreshold(): float
    {
        return (float) $this->config['matching']['name_similarity_threshold'];
    }

    public function proximityMatchThreshold(): float
    {
        return (float) $this->config['matching']['proximity_match_threshold'];
    }

    public function proximityMaxKm(): float
    {
        return (float) $this->config['matching']['proximity_max_km'];
    }

    public function defaultProvider(): string
    {
        return (string) $this->config['default_provider'];
    }

    public function defaultGeocodingProvider(): string
    {
        return (string) $this->config['default_geocoding_provider'];
    }

    public function defaultRoutingProvider(): string
    {
        return (string) $this->config['default_routing_provider'];
    }

    public function defaultTrafficProvider(): string
    {
        return (string) $this->config['default_traffic_provider'];
    }

    public function geocodeLocationTtlDays(): int
    {
        return (int) $this->config['location_freshness']['geocode_ttl_days'];
    }

    public function manualLocationTtlDays(): int
    {
        return (int) $this->config['location_freshness']['manual_ttl_days'];
    }

    public function gpsLocationTtlMinutes(): int
    {
        return (int) $this->config['location_freshness']['gps_ttl_minutes'];
    }

    public function workerTrackingEnabled(): bool
    {
        return (bool) $this->config['worker_tracking']['enabled'];
    }

    public function minimumPingIntervalSeconds(): int
    {
        return (int) $this->config['worker_tracking']['minimum_ping_interval_seconds'];
    }

    public function minimumMovementMetres(): float
    {
        return (float) $this->config['worker_tracking']['minimum_movement_metres'];
    }

    public function maximumCaptureAgeSeconds(): int
    {
        return (int) $this->config['worker_tracking']['maximum_capture_age_seconds'];
    }

    public function maximumFutureSkewSeconds(): int
    {
        return (int) $this->config['worker_tracking']['maximum_future_skew_seconds'];
    }

    public function maximumLocationAccuracyMetres(): float
    {
        return (float) $this->config['worker_tracking']['maximum_accuracy_metres'];
    }

    public function locationRetentionDays(): int
    {
        return (int) $this->config['worker_tracking']['retention_days'];
    }

    public function workerLocationStaleAfterSeconds(): int { return (int) $this->config['worker_tracking']['stale_after_seconds']; }
    public function workerDeviceRateLimitSeconds(): int { return (int) $this->config['worker_tracking']['device_rate_limit_seconds']; }
    public function workerRetentionPolicy(): string { return (string) $this->config['worker_tracking']['retention_policy']; }
    public function offlineMaxBatchSize(): int { return max(1, min(250, (int) $this->config['worker_tracking']['offline_max_batch_size'])); }
    public function offlineMaxAgeDays(): int { return max(1, min($this->locationRetentionDays(), (int) $this->config['worker_tracking']['offline_max_age_days'])); }

    public function geofencingEnabled(): bool
    {
        return (bool) $this->config['geofencing']['enabled'];
    }

    public function geofenceTransitionSamples(): int
    {
        return (int) $this->config['geofencing']['transition_samples'];
    }

    public function geofenceHysteresisMetres(): float
    {
        return (float) $this->config['geofencing']['hysteresis_metres'];
    }

    public function defaultGeofenceDwellSeconds(): int
    {
        return (int) $this->config['geofencing']['default_dwell_seconds'];
    }

    public function minimumGeofenceRadiusMetres(): float
    {
        return (float) $this->config['geofencing']['minimum_radius_metres'];
    }

    public function maximumGeofenceRadiusMetres(): float
    {
        return (float) $this->config['geofencing']['maximum_radius_metres'];
    }

    public function maximumGeofencePolygonPoints(): int
    {
        return (int) $this->config['geofencing']['maximum_polygon_points'];
    }

    /** @return array<string,mixed> */
    public function trafficAwareRouteTtlSeconds(): int
    {
        return (int) $this->config['routing_snapshots']['traffic_aware_ttl_seconds'];
    }

    public function trafficUnawareRouteTtlSeconds(): int
    {
        return (int) $this->config['routing_snapshots']['traffic_unaware_ttl_seconds'];
    }

    public function lastValidRouteMaxAgeHours(): int
    {
        return (int) $this->config['routing_snapshots']['last_valid_max_age_hours'];
    }

    public function routeCoordinatePrecisionDecimals(): int
    {
        return (int) $this->config['routing_snapshots']['coordinate_precision_decimals'];
    }

    public function routeHistoryLimit(): int
    {
        return (int) $this->config['routing_snapshots']['history_limit'];
    }

    public function matrixCacheTtlSeconds(bool $trafficAware = true): int
    {
        return (int) $this->config['travel_matrix'][$trafficAware ? 'cache_ttl_seconds' : 'traffic_unaware_cache_ttl_seconds'];
    }

    public function matrixLastValidMaxAgeHours(): int
    {
        return (int) $this->config['travel_matrix']['last_valid_max_age_hours'];
    }

    public function matrixMaximumOrigins(): int
    {
        return (int) $this->config['travel_matrix']['maximum_origins'];
    }

    public function matrixMaximumDestinations(): int
    {
        return (int) $this->config['travel_matrix']['maximum_destinations'];
    }

    public function nearestResourceLimit(): int
    {
        return (int) $this->config['travel_matrix']['nearest_resource_limit'];
    }

    public function nearestCandidatePool(): int
    {
        return (int) $this->config['travel_matrix']['nearest_candidate_pool'];
    }

    public function matrixHistoryLimit(): int
    {
        return (int) $this->config['travel_matrix']['history_limit'];
    }

    public function routePlanMaximumStops(): int
    {
        return (int) $this->config['route_planner']['maximum_stops'];
    }

    public function routePlanHistoryLimit(): int
    {
        return (int) $this->config['route_planner']['history_limit'];
    }

    public function routePlanMaximumGeometrySegments(): int
    {
        return (int) $this->config['route_planner']['maximum_geometry_segments'];
    }

    public function routePlanDefaultServiceDurationSeconds(): int
    {
        return (int) $this->config['route_planner']['default_service_duration_seconds'];
    }

    public function routePlanExactOptimisationMaxStops(): int { return (int) $this->config['route_planner']['exact_optimisation_max_stops']; }
    public function routePlanOptimisationTimeoutSeconds(): int { return (int) $this->config['route_planner']['optimisation_timeout_seconds']; }

    public function dispatchCandidateLimit(): int
    {
        return (int) $this->config['dispatch_intelligence']['candidate_limit'];
    }

    public function dispatchRecommendationTtlSeconds(): int
    {
        return (int) $this->config['dispatch_intelligence']['recommendation_ttl_seconds'];
    }

    public function dispatchDailyCapacity(): int
    {
        return (int) $this->config['dispatch_intelligence']['daily_capacity'];
    }

    public function dispatchWeights(): array
    {
        return (array) $this->config['dispatch_intelligence']['weights'];
    }

    public function providerQuotaDailyRequestLimit(): int { return (int) $this->config['provider_quota']['daily_request_limit']; }
    public function providerQuotaMonthlyRequestLimit(): int { return (int) $this->config['provider_quota']['monthly_request_limit']; }
    public function providerQuotaSoftLimitPercent(): int { return (int) $this->config['provider_quota']['soft_limit_percent']; }



    public function fallbackApprovedNetworkLimit(): int { return (int) $this->config['resource_fallback']['approved_network_limit']; }
    public function fallbackDiscoveryResultLimit(): int { return (int) $this->config['resource_fallback']['discovery_result_limit']; }
    public function fallbackCandidateLimit(): int { return (int) $this->config['resource_fallback']['candidate_limit']; }
    public function fallbackHistoryLimit(): int { return (int) $this->config['resource_fallback']['history_limit']; }
    public function fallbackDefaultRadiusMetres(): float { return (float) $this->config['resource_fallback']['default_radius_metres']; }
    public function fallbackHumanReviewTimeoutSeconds(): int { return (int) $this->config['resource_fallback']['human_review_timeout_seconds']; }

    public function territoryAnalyticsCellSizeKm(): float
    {
        return (float) $this->config['territory_analytics']['cell_size_km'];
    }

    public function territoryAnalyticsMaximumCells(): int
    {
        return (int) $this->config['territory_analytics']['maximum_cells'];
    }

    public function territoryAnalyticsSupplierPool(): int
    {
        return (int) $this->config['territory_analytics']['supplier_pool'];
    }

    public function territoryAnalyticsTargetProviderCount(): int
    {
        return (int) $this->config['territory_analytics']['target_provider_count'];
    }

    public function territoryAnalyticsCompetitorDensityCeiling(): float
    {
        return (float) $this->config['territory_analytics']['competitor_density_ceiling'];
    }

    public function territoryAnalyticsBranchDistanceCeilingKm(): float
    {
        return (float) $this->config['territory_analytics']['branch_distance_ceiling_km'];
    }

    public function territoryAnalyticsHistoryLimit(): int
    {
        return (int) $this->config['territory_analytics']['history_limit'];
    }

    public function territoryAnalyticsSnapshotTtlSeconds(): int
    {
        return max(60, (int) ($this->config['territory_analytics']['snapshot_ttl_seconds'] ?? 86400));
    }

    public function territoryAnalyticsVersion(): string
    {
        return (string) ($this->config['territory_analytics']['analytics_version'] ?? 'territory-analytics-v2');
    }

    public function territoryAnalyticsExpansionWeights(): array
    {
        return (array) $this->config['territory_analytics']['expansion_weights'];
    }

    public function assertMatrixLimits(int $origins, int $destinations, string $routingPreference = 'TRAFFIC_AWARE', string $travelMode = 'DRIVE'): void
    {
        if ($origins < 1 || $origins > $this->matrixMaximumOrigins()) {
            throw MapsIntelligenceException::fromCode('MAPS_ROUTE_MATRIX_LIMIT_EXCEEDED', sprintf('Matrix origins must be between 1 and %d.', $this->matrixMaximumOrigins()));
        }
        if ($destinations < 1 || $destinations > $this->matrixMaximumDestinations()) {
            throw MapsIntelligenceException::fromCode('MAPS_ROUTE_MATRIX_LIMIT_EXCEEDED', sprintf('Matrix destinations must be between 1 and %d.', $this->matrixMaximumDestinations()));
        }
        $elements = $origins * $destinations;
        if ($elements > $this->maximumRouteMatrixElements()) {
            throw MapsIntelligenceException::fromCode('MAPS_ROUTE_MATRIX_LIMIT_EXCEEDED', sprintf('Matrix elements must not exceed %d.', $this->maximumRouteMatrixElements()));
        }
        if (($routingPreference === 'TRAFFIC_AWARE_OPTIMAL' || $travelMode === 'TRANSIT') && $elements > 100) {
            throw MapsIntelligenceException::fromCode('MAPS_ROUTE_MATRIX_LIMIT_EXCEEDED', 'Traffic-aware optimal and transit matrices must not exceed 100 elements.');
        }
    }

    public function mapUi(): array
    {
        return (array) $this->config['map_ui'];
    }

    public function teamMapRefreshSeconds(): int
    {
        return (int) $this->config['map_ui']['team_refresh_seconds'];
    }

    public function providerConfig(string $provider, array $overrides = []): array
    {
        if (! array_key_exists($provider, $this->config['providers'])) {
            throw MapsIntelligenceException::fromCode('MAPS_CONFIGURATION_INVALID', 'The configured maps provider is not declared.', ['provider' => $provider]);
        }

        $allowedOverrideKeys = ['base_uri', 'timeout_seconds', 'retry_attempts', 'field_masks'];
        foreach (array_keys($overrides) as $key) {
            if (! in_array((string) $key, $allowedOverrideKeys, true)) {
                throw MapsIntelligenceException::fromCode('MAPS_CONFIGURATION_INVALID', 'Provider configuration contains an unsupported setting.', [
                    'provider' => $provider,
                    'setting' => (string) $key,
                ]);
            }
        }

        $merged = array_replace_recursive((array) $this->config['providers'][$provider], $overrides);
        $this->validateProvider($provider, $merged);
        $merged['page_size'] = $this->maximumProviderPageSize();

        return $merged;
    }

    public function assertSearchLimits(int $maximumResults, ?float $radiusMetres): void
    {
        if ($maximumResults < 1 || $maximumResults > $this->maximumResults()) {
            throw MapsIntelligenceException::fromCode('MAPS_SEARCH_LIMIT_EXCEEDED', sprintf(
                'Search result limit must be between 1 and %d.',
                $this->maximumResults(),
            ));
        }

        if ($radiusMetres !== null && ($radiusMetres <= 0 || $radiusMetres > $this->maximumRadiusMetres())) {
            throw MapsIntelligenceException::fromCode('MAPS_INVALID_RADIUS', sprintf(
                'Search radius must be greater than zero and no more than %s metres.',
                rtrim(rtrim(number_format($this->maximumRadiusMetres(), 3, '.', ''), '0'), '.'),
            ));
        }
    }

    private function validate(): void
    {
        $version = trim((string) ($this->config['configuration_version'] ?? ''));
        if ($version === '') {
            $this->invalid('configuration_version must be a non-empty string');
        }

        $providers = $this->config['providers'] ?? null;
        if (! is_array($providers) || $providers === []) {
            $this->invalid('providers must contain at least one provider');
        }

        foreach (['default_provider', 'default_geocoding_provider', 'default_routing_provider', 'default_traffic_provider'] as $defaultKey) {
            $defaultProvider = trim((string) ($this->config[$defaultKey] ?? ''));
            if ($defaultProvider === '' || ! array_key_exists($defaultProvider, $providers)) {
                $this->invalid("{$defaultKey} must reference a declared provider");
            }
        }

        $this->validateIntegerRange('limits.maximum_results', $this->config['limits']['maximum_results'] ?? null, 1, 500);
        $this->validateFloatRange('limits.maximum_radius_metres', $this->config['limits']['maximum_radius_metres'] ?? null, 1.0, 50000.0);
        $this->validateIntegerRange('limits.maximum_provider_page_size', $this->config['limits']['maximum_provider_page_size'] ?? null, 1, 20);
        $this->validateIntegerRange('limits.maximum_route_matrix_elements', $this->config['limits']['maximum_route_matrix_elements'] ?? null, 1, 625);

        $this->validateIntegerRange('location_freshness.geocode_ttl_days', $this->config['location_freshness']['geocode_ttl_days'] ?? null, 1, 3650);
        $this->validateIntegerRange('location_freshness.manual_ttl_days', $this->config['location_freshness']['manual_ttl_days'] ?? null, 1, 3650);
        $this->validateIntegerRange('location_freshness.gps_ttl_minutes', $this->config['location_freshness']['gps_ttl_minutes'] ?? null, 1, 1440);

        if (! is_bool($this->config['worker_tracking']['enabled'] ?? null)) {
            $this->invalid('worker_tracking.enabled must be boolean');
        }
        $this->validateIntegerRange('worker_tracking.minimum_ping_interval_seconds', $this->config['worker_tracking']['minimum_ping_interval_seconds'] ?? null, 1, 3600);
        $this->validateFloatRange('worker_tracking.minimum_movement_metres', $this->config['worker_tracking']['minimum_movement_metres'] ?? null, 0.0, 10000.0);
        $this->validateIntegerRange('worker_tracking.maximum_capture_age_seconds', $this->config['worker_tracking']['maximum_capture_age_seconds'] ?? null, 1, 86400);
        $this->validateIntegerRange('worker_tracking.maximum_future_skew_seconds', $this->config['worker_tracking']['maximum_future_skew_seconds'] ?? null, 0, 3600);
        $this->validateFloatRange('worker_tracking.maximum_accuracy_metres', $this->config['worker_tracking']['maximum_accuracy_metres'] ?? null, 1.0, 10000.0);
        $this->validateIntegerRange('worker_tracking.stale_after_seconds', $this->config['worker_tracking']['stale_after_seconds'] ?? null, 30, 86400);
        $this->validateIntegerRange('worker_tracking.device_rate_limit_seconds', $this->config['worker_tracking']['device_rate_limit_seconds'] ?? null, 1, 3600);
        if (!in_array((string)($this->config['worker_tracking']['retention_policy'] ?? ''), ['transient','standard','forensic'], true)) $this->invalid('worker_tracking.retention_policy must be transient, standard or forensic');
        $this->validateIntegerRange('worker_tracking.retention_days', $this->config['worker_tracking']['retention_days'] ?? null, 1, 3650);

        if (! is_bool($this->config['geofencing']['enabled'] ?? null)) {
            $this->invalid('geofencing.enabled must be boolean');
        }
        $this->validateIntegerRange('geofencing.transition_samples', $this->config['geofencing']['transition_samples'] ?? null, 1, 10);
        $this->validateFloatRange('geofencing.hysteresis_metres', $this->config['geofencing']['hysteresis_metres'] ?? null, 0.0, 500.0);
        $this->validateIntegerRange('geofencing.default_dwell_seconds', $this->config['geofencing']['default_dwell_seconds'] ?? null, 0, 86400);
        $this->validateFloatRange('geofencing.minimum_radius_metres', $this->config['geofencing']['minimum_radius_metres'] ?? null, 1.0, 1000.0);
        $this->validateFloatRange('geofencing.maximum_radius_metres', $this->config['geofencing']['maximum_radius_metres'] ?? null, 10.0, 50000.0);
        if ((float) $this->config['geofencing']['minimum_radius_metres'] >= (float) $this->config['geofencing']['maximum_radius_metres']) {
            $this->invalid('geofencing.minimum_radius_metres must be lower than geofencing.maximum_radius_metres');
        }
        $this->validateIntegerRange('geofencing.maximum_polygon_points', $this->config['geofencing']['maximum_polygon_points'] ?? null, 3, 500);

        $this->validateIntegerRange('routing_snapshots.traffic_aware_ttl_seconds', $this->config['routing_snapshots']['traffic_aware_ttl_seconds'] ?? null, 30, 86400);
        $this->validateIntegerRange('routing_snapshots.traffic_unaware_ttl_seconds', $this->config['routing_snapshots']['traffic_unaware_ttl_seconds'] ?? null, 60, 604800);
        $this->validateIntegerRange('routing_snapshots.last_valid_max_age_hours', $this->config['routing_snapshots']['last_valid_max_age_hours'] ?? null, 1, 720);
        $this->validateIntegerRange('routing_snapshots.coordinate_precision_decimals', $this->config['routing_snapshots']['coordinate_precision_decimals'] ?? null, 3, 7);
        $this->validateIntegerRange('routing_snapshots.history_limit', $this->config['routing_snapshots']['history_limit'] ?? null, 1, 500);

        $this->validateIntegerRange('travel_matrix.cache_ttl_seconds', $this->config['travel_matrix']['cache_ttl_seconds'] ?? null, 30, 86400);
        $this->validateIntegerRange('travel_matrix.traffic_unaware_cache_ttl_seconds', $this->config['travel_matrix']['traffic_unaware_cache_ttl_seconds'] ?? null, 60, 604800);
        $this->validateIntegerRange('travel_matrix.last_valid_max_age_hours', $this->config['travel_matrix']['last_valid_max_age_hours'] ?? null, 1, 720);
        $this->validateIntegerRange('travel_matrix.maximum_origins', $this->config['travel_matrix']['maximum_origins'] ?? null, 1, 25);
        $this->validateIntegerRange('travel_matrix.maximum_destinations', $this->config['travel_matrix']['maximum_destinations'] ?? null, 1, 25);
        $this->validateIntegerRange('travel_matrix.nearest_resource_limit', $this->config['travel_matrix']['nearest_resource_limit'] ?? null, 1, 100);
        $this->validateIntegerRange('travel_matrix.nearest_candidate_pool', $this->config['travel_matrix']['nearest_candidate_pool'] ?? null, 1, 250);
        if ((int) ($this->config['travel_matrix']['nearest_candidate_pool'] ?? 0) < (int) ($this->config['travel_matrix']['nearest_resource_limit'] ?? 0)) {
            $this->invalid('travel_matrix.nearest_candidate_pool must be greater than or equal to travel_matrix.nearest_resource_limit');
        }
        if ((int) ($this->config['travel_matrix']['nearest_candidate_pool'] ?? 0) > (int) ($this->config['travel_matrix']['maximum_destinations'] ?? 0)) {
            $this->invalid('travel_matrix.nearest_candidate_pool must not exceed travel_matrix.maximum_destinations');
        }
        $this->validateIntegerRange('travel_matrix.history_limit', $this->config['travel_matrix']['history_limit'] ?? null, 1, 500);

        $this->validateIntegerRange('route_planner.maximum_stops', $this->config['route_planner']['maximum_stops'] ?? null, 2, 25);
        $this->validateIntegerRange('route_planner.history_limit', $this->config['route_planner']['history_limit'] ?? null, 1, 500);
        $this->validateIntegerRange('route_planner.maximum_geometry_segments', $this->config['route_planner']['maximum_geometry_segments'] ?? null, 0, 24);
        $this->validateIntegerRange('route_planner.default_service_duration_seconds', $this->config['route_planner']['default_service_duration_seconds'] ?? null, 0, 86400);
        $this->validateIntegerRange('route_planner.exact_optimisation_max_stops', $this->config['route_planner']['exact_optimisation_max_stops'] ?? null, 2, 10);
        $this->validateIntegerRange('route_planner.optimisation_timeout_seconds', $this->config['route_planner']['optimisation_timeout_seconds'] ?? null, 1, 30);
        if ((int)($this->config['route_planner']['maximum_stops'] ?? 0) ** 2 > (int)($this->config['limits']['maximum_route_matrix_elements'] ?? 0)) {
            $this->invalid('route_planner.maximum_stops squared must not exceed limits.maximum_route_matrix_elements');
        }

        $this->validateIntegerRange('provider_quota.daily_request_limit', $this->config['provider_quota']['daily_request_limit'] ?? null, 1, 100000000);
        $this->validateIntegerRange('provider_quota.monthly_request_limit', $this->config['provider_quota']['monthly_request_limit'] ?? null, 1, 1000000000);
        $this->validateIntegerRange('provider_quota.soft_limit_percent', $this->config['provider_quota']['soft_limit_percent'] ?? null, 1, 99);

        $this->validateIntegerRange('dispatch_intelligence.candidate_limit', $this->config['dispatch_intelligence']['candidate_limit'] ?? null, 1, 25);
        $this->validateIntegerRange('dispatch_intelligence.recommendation_ttl_seconds', $this->config['dispatch_intelligence']['recommendation_ttl_seconds'] ?? null, 60, 3600);
        $this->validateIntegerRange('dispatch_intelligence.daily_capacity', $this->config['dispatch_intelligence']['daily_capacity'] ?? null, 1, 100);
        $dispatchWeights = $this->config['dispatch_intelligence']['weights'] ?? null;
        if (! is_array($dispatchWeights)) {
            $this->invalid('dispatch_intelligence.weights must be an object');
        }
        $actualDispatchKeys = array_keys($dispatchWeights);
        sort($actualDispatchKeys);
        $expectedDispatchKeys = self::DISPATCH_WEIGHT_KEYS;
        sort($expectedDispatchKeys);
        if ($actualDispatchKeys !== $expectedDispatchKeys) {
            $this->invalid('dispatch_intelligence.weights must contain exactly the supported signal keys');
        }
        $dispatchWeightSum = 0.0;
        foreach ($dispatchWeights as $key => $weight) {
            if (! is_int($weight) && ! is_float($weight)) {
                $this->invalid("dispatch_intelligence.weights.{$key} must be numeric");
            }
            $value = (float) $weight;
            if ($value < 0.0 || $value > 100.0) {
                $this->invalid("dispatch_intelligence.weights.{$key} must be between 0 and 100");
            }
            $dispatchWeightSum += $value;
        }
        if (abs($dispatchWeightSum - 100.0) > 0.000001) {
            $this->invalid('dispatch_intelligence.weights must sum to exactly 100', ['sum' => round($dispatchWeightSum, 8)]);
        }



        $this->validateIntegerRange('resource_fallback.approved_network_limit', $this->config['resource_fallback']['approved_network_limit'] ?? null, 1, 25);
        $this->validateIntegerRange('resource_fallback.discovery_result_limit', $this->config['resource_fallback']['discovery_result_limit'] ?? null, 1, 100);
        $this->validateIntegerRange('resource_fallback.candidate_limit', $this->config['resource_fallback']['candidate_limit'] ?? null, 1, 25);
        $this->validateIntegerRange('resource_fallback.history_limit', $this->config['resource_fallback']['history_limit'] ?? null, 1, 500);
        $this->validateFloatRange('resource_fallback.default_radius_metres', $this->config['resource_fallback']['default_radius_metres'] ?? null, 100.0, $this->maximumRadiusMetres());
        if ((int)($this->config['resource_fallback']['approved_network_limit'] ?? 0) > (int)($this->config['travel_matrix']['nearest_resource_limit'] ?? 0)) {
            $this->invalid('resource_fallback.approved_network_limit must not exceed travel_matrix.nearest_resource_limit');
        }

        $this->validateFloatRange('territory_analytics.cell_size_km', $this->config['territory_analytics']['cell_size_km'] ?? null, 0.25, 100.0);
        $this->validateIntegerRange('territory_analytics.maximum_cells', $this->config['territory_analytics']['maximum_cells'] ?? null, 1, 25);
        $this->validateIntegerRange('territory_analytics.supplier_pool', $this->config['territory_analytics']['supplier_pool'] ?? null, 1, 25);
        if ((int)($this->config['territory_analytics']['maximum_cells'] ?? 0) * (int)($this->config['territory_analytics']['supplier_pool'] ?? 0) > (int)($this->config['limits']['maximum_route_matrix_elements'] ?? 0)) {
            $this->invalid('territory_analytics maximum_cells × supplier_pool must not exceed limits.maximum_route_matrix_elements');
        }
        $this->validateIntegerRange('territory_analytics.target_provider_count', $this->config['territory_analytics']['target_provider_count'] ?? null, 1, 100);
        $this->validateFloatRange('territory_analytics.competitor_density_ceiling', $this->config['territory_analytics']['competitor_density_ceiling'] ?? null, 0.1, 1000.0);
        $this->validateFloatRange('territory_analytics.branch_distance_ceiling_km', $this->config['territory_analytics']['branch_distance_ceiling_km'] ?? null, 1.0, 1000.0);
        $this->validateIntegerRange('territory_analytics.history_limit', $this->config['territory_analytics']['history_limit'] ?? null, 1, 500);
        $expansionWeights = $this->config['territory_analytics']['expansion_weights'] ?? null;
        $expectedExpansionKeys = ['demand','coverage_gap','competitor_pressure','supplier_access','branch_distance'];
        if (!is_array($expansionWeights)) $this->invalid('territory_analytics.expansion_weights must be an object');
        $actualExpansionKeys = array_keys($expansionWeights); sort($actualExpansionKeys); sort($expectedExpansionKeys);
        if ($actualExpansionKeys !== $expectedExpansionKeys) $this->invalid('territory_analytics.expansion_weights must contain exactly the supported signal keys');
        $expansionWeightSum = 0.0;
        foreach ($expansionWeights as $key => $weight) {
            if (!is_int($weight) && !is_float($weight)) $this->invalid("territory_analytics.expansion_weights.{$key} must be numeric");
            $value=(float)$weight; if($value<0.0||$value>1.0)$this->invalid("territory_analytics.expansion_weights.{$key} must be between 0 and 1"); $expansionWeightSum += $value;
        }
        if (abs($expansionWeightSum - 1.0) > 0.000001) $this->invalid('territory_analytics.expansion_weights must sum to exactly 1', ['sum'=>round($expansionWeightSum,8)]);

        if (! is_bool($this->config['map_ui']['enabled'] ?? null)) {
            $this->invalid('map_ui.enabled must be boolean');
        }
        $tileUrl = trim((string) ($this->config['map_ui']['tile_url'] ?? ''));
        if ($tileUrl === '' || ! str_starts_with($tileUrl, 'https://') || ! str_contains($tileUrl, '{z}') || ! str_contains($tileUrl, '{x}') || ! str_contains($tileUrl, '{y}')) {
            $this->invalid('map_ui.tile_url must be an HTTPS slippy-map template containing {z}, {x} and {y}');
        }
        if (trim((string) ($this->config['map_ui']['tile_attribution'] ?? '')) === '') {
            $this->invalid('map_ui.tile_attribution must be non-empty');
        }
        $attributionUrl = trim((string) ($this->config['map_ui']['tile_attribution_url'] ?? ''));
        if ($attributionUrl !== '' && ! str_starts_with($attributionUrl, 'https://')) {
            $this->invalid('map_ui.tile_attribution_url must be HTTPS when configured');
        }
        $this->validateIntegerRange('map_ui.tile_min_zoom', $this->config['map_ui']['tile_min_zoom'] ?? null, 0, 22);
        $this->validateIntegerRange('map_ui.tile_max_zoom', $this->config['map_ui']['tile_max_zoom'] ?? null, 1, 24);
        if ((int) $this->config['map_ui']['tile_min_zoom'] >= (int) $this->config['map_ui']['tile_max_zoom']) {
            $this->invalid('map_ui.tile_min_zoom must be lower than map_ui.tile_max_zoom');
        }
        $this->validateIntegerRange('map_ui.default_zoom', $this->config['map_ui']['default_zoom'] ?? null, 0, 24);
        $this->validateIntegerRange('map_ui.single_point_zoom', $this->config['map_ui']['single_point_zoom'] ?? null, 0, 24);
        $this->validateFloatRange('map_ui.default_latitude', $this->config['map_ui']['default_latitude'] ?? null, -90.0, 90.0);
        $this->validateFloatRange('map_ui.default_longitude', $this->config['map_ui']['default_longitude'] ?? null, -180.0, 180.0);
        $this->validateIntegerRange('map_ui.team_refresh_seconds', $this->config['map_ui']['team_refresh_seconds'] ?? null, 10, 3600);

        $this->validateWeights('ranking.weights', $this->config['ranking']['weights'] ?? null, self::RANKING_WEIGHT_KEYS);
        $this->validateFloatRange('ranking.distance_ceiling_km', $this->config['ranking']['distance_ceiling_km'] ?? null, 0.001, 1000.0);
        $this->validateFloatRange('ranking.review_count_log_ceiling', $this->config['ranking']['review_count_log_ceiling'] ?? null, 0.001, 12.0);
        $this->validateFloatRange('ranking.missing_distance_km', $this->config['ranking']['missing_distance_km'] ?? null, 0.0, 1000.0);
        $this->validateFloatRange('ranking.uncategorised_match_score', $this->config['ranking']['uncategorised_match_score'] ?? null, 0.0, 1.0);

        $this->validateWeights('matching.weights', $this->config['matching']['weights'] ?? null, self::MATCHING_WEIGHT_KEYS);
        $this->validateFloatRange('matching.confirmed_threshold', $this->config['matching']['confirmed_threshold'] ?? null, 0.0, 1.0);
        $this->validateFloatRange('matching.ambiguous_threshold', $this->config['matching']['ambiguous_threshold'] ?? null, 0.0, 1.0);
        if ((float) $this->config['matching']['ambiguous_threshold'] >= (float) $this->config['matching']['confirmed_threshold']) {
            $this->invalid('matching.ambiguous_threshold must be lower than matching.confirmed_threshold');
        }
        $this->validateFloatRange('matching.address_similarity_threshold', $this->config['matching']['address_similarity_threshold'] ?? null, 0.0, 1.0);
        $this->validateFloatRange('matching.name_similarity_threshold', $this->config['matching']['name_similarity_threshold'] ?? null, 0.0, 1.0);
        $this->validateFloatRange('matching.proximity_match_threshold', $this->config['matching']['proximity_match_threshold'] ?? null, 0.0, 1.0);
        $this->validateFloatRange('matching.proximity_max_km', $this->config['matching']['proximity_max_km'] ?? null, 0.001, 1000.0);

        foreach ($providers as $provider => $providerConfig) {
            if (! is_array($providerConfig)) {
                $this->invalid('provider configuration must be an object', ['provider' => (string) $provider]);
            }
            $this->validateProvider((string) $provider, $providerConfig);
        }
    }

    private function validateProvider(string $provider, array $providerConfig): void
    {
        $this->validateIntegerRange("providers.{$provider}.timeout_seconds", $providerConfig['timeout_seconds'] ?? null, 1, 30);
        $this->validateIntegerRange("providers.{$provider}.retry_attempts", $providerConfig['retry_attempts'] ?? null, 0, 3);

        $baseUri = rtrim((string) ($providerConfig['base_uri'] ?? ''), '/');
        $expectedBaseUris = [
            'google-places' => 'https://places.googleapis.com',
            'google-geocoding' => 'https://geocode.googleapis.com',
            'google-routes' => 'https://routes.googleapis.com',
        ];
        if (isset($expectedBaseUris[$provider]) && $baseUri !== $expectedBaseUris[$provider]) {
            $this->invalid('Google provider base_uri must use its allowlisted HTTPS endpoint', ['provider' => $provider]);
        }

        $fieldMasks = $providerConfig['field_masks'] ?? null;
        if (! is_array($fieldMasks)) {
            $this->invalid('provider field_masks must be configured', ['provider' => $provider]);
        }
        $requiredMasks = match ($provider) {
            'google-places' => ['search', 'details'],
            'google-geocoding' => ['forward', 'reverse'],
            'google-routes' => ['route', 'matrix'],
            default => array_keys($fieldMasks),
        };
        foreach ($requiredMasks as $maskName) {
            $mask = trim((string) ($fieldMasks[$maskName] ?? ''));
            if ($mask === '' || str_contains($mask, '*')) {
                $this->invalid('provider field mask must be explicit and non-empty', ['provider' => $provider, 'mask' => $maskName]);
            }
        }
    }

    private function validateWeights(string $path, mixed $weights, array $requiredKeys): void
    {
        if (! is_array($weights)) {
            $this->invalid("{$path} must be an object");
        }

        $actualKeys = array_keys($weights);
        sort($actualKeys);
        $expectedKeys = $requiredKeys;
        sort($expectedKeys);
        if ($actualKeys !== $expectedKeys) {
            $this->invalid("{$path} must contain exactly the supported signal keys");
        }

        $sum = 0.0;
        foreach ($weights as $key => $weight) {
            if (! is_int($weight) && ! is_float($weight)) {
                $this->invalid("{$path}.{$key} must be numeric");
            }
            $value = (float) $weight;
            if ($value < 0.0 || $value > 1.0) {
                $this->invalid("{$path}.{$key} must be between 0 and 1");
            }
            $sum += $value;
        }

        if (abs($sum - 1.0) > 0.000001) {
            $this->invalid("{$path} must sum to exactly 1.0", ['sum' => round($sum, 8)]);
        }
    }

    private function validateIntegerRange(string $path, mixed $value, int $minimum, int $maximum): void
    {
        if (! is_int($value) || $value < $minimum || $value > $maximum) {
            $this->invalid("{$path} must be an integer between {$minimum} and {$maximum}");
        }
    }

    private function validateFloatRange(string $path, mixed $value, float $minimum, float $maximum): void
    {
        if ((! is_int($value) && ! is_float($value)) || (float) $value < $minimum || (float) $value > $maximum) {
            $this->invalid("{$path} must be numeric between {$minimum} and {$maximum}");
        }
    }

    private function invalid(string $message, array $context = []): never
    {
        throw MapsIntelligenceException::fromCode('MAPS_CONFIGURATION_INVALID', $message, $context);
    }
}
