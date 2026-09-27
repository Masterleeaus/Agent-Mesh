<?php

declare(strict_types=1);

namespace Tests\Integration\Extensions\TitanMapsIntelligence;

use App\Extensions\TitanMapsIntelligence\Models\CandidateMatch;
use App\Extensions\TitanMapsIntelligence\Models\CandidatePromotion;
use App\Extensions\TitanMapsIntelligence\Models\DiscoveryCandidate;
use App\Extensions\TitanMapsIntelligence\Models\DiscoveryRun;
use App\Extensions\TitanMapsIntelligence\Models\DiscoverySearch;
use App\Extensions\TitanMapsIntelligence\Models\ExternalPlace;
use App\Extensions\TitanMapsIntelligence\Models\ExternalPlaceContact;
use App\Extensions\TitanMapsIntelligence\Models\FieldObservation;
use App\Extensions\TitanMapsIntelligence\Models\MapLocation;
use App\Extensions\TitanMapsIntelligence\Models\MapWorkerTrackingState;
use App\Extensions\TitanMapsIntelligence\Models\MapLocationPing;
use App\Extensions\TitanMapsIntelligence\Models\MapProviderConnection;
use App\Extensions\TitanMapsIntelligence\Models\MapsSuppression;
use App\Extensions\TitanMapsIntelligence\Models\MapsUsageRecord;
use App\Extensions\TitanMapsIntelligence\Models\TerritoryAnalysis;
use App\Extensions\TitanMapsIntelligence\Models\TerritoryAnalysisCell;
use App\Extensions\TitanMapsIntelligence\Models\RouteSnapshot;
use App\Extensions\TitanMapsIntelligence\Models\EtaSnapshot;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

final class MigrationCrudSmokeTest extends TestCase
{
    public function test_clean_mysql_migrations_create_all_owned_tables_and_models_can_crud(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            self::markTestSkipped('Pass 2 migration smoke test is intentionally MySQL-specific.');
        }

        $root = dirname(__DIR__, 2);
        $contract = json_decode(
            (string) file_get_contents($root.'/database/schema-contract.json'),
            true,
            flags: JSON_THROW_ON_ERROR,
        );

        Artisan::call('migrate', [
            '--path' => $root.'/database/migrations',
            '--realpath' => true,
            '--force' => true,
        ]);

        foreach ($contract as $table => $columns) {
            self::assertTrue(Schema::hasTable($table), $table);
            self::assertTrue(Schema::hasColumns($table, array_merge($columns, ['created_at', 'updated_at'])), $table);
        }

        DB::beginTransaction();
        try {
            $companyA = 'maps-smoke-company-a';
            $companyB = 'maps-smoke-company-b';

            MapProviderConnection::query()->create([
                'company_id' => $companyA,
                'provider' => 'smoke-provider',
                'credential_reference' => 'vault://smoke/a',
                'enabled' => true,
            ]);
            MapProviderConnection::query()->create([
                'company_id' => $companyB,
                'provider' => 'smoke-provider',
                'credential_reference' => 'vault://smoke/b',
                'enabled' => true,
            ]);
            self::assertSame(1, MapProviderConnection::query()->forCompany($companyA)->count());

            $search = DiscoverySearch::query()->create([
                'company_id' => $companyA,
                'purpose' => 'provider_discovery',
                'query' => 'plumber',
                'categories' => [],
                'filters' => [],
                'provider_strategy' => [],
                'maximum_results' => 10,
                'status' => 'queued',
            ]);

            DiscoveryRun::query()->create([
                'company_id' => $companyA,
                'discovery_search_id' => $search->getKey(),
                'provider' => 'smoke-provider',
                'current_stage' => 'running',
            ]);

            $place = ExternalPlace::query()->create([
                'company_id' => $companyA,
                'provider' => 'smoke-provider',
                'provider_place_id' => 'smoke-place-1',
                'canonical_key' => 'smoke-place-canonical-1',
                'name' => 'Smoke Test Plumbing',
                'categories' => ['plumber'],
                'confidence' => 0.8,
            ]);

            ExternalPlaceContact::query()->create([
                'company_id' => $companyA,
                'external_place_id' => $place->getKey(),
                'contact_type' => 'phone',
                'normalised_value' => '+61123456789',
                'display_value' => '01 2345 6789',
                'verification_status' => 'observed',
            ]);

            FieldObservation::query()->create([
                'company_id' => $companyA,
                'external_place_id' => $place->getKey(),
                'field' => 'phone',
                'observed_value' => ['value' => '+61123456789'],
                'provider' => 'smoke-provider',
                'observed_at' => now(),
                'confidence' => 0.8,
                'restrictions' => [],
                'observation_type' => 'provider_observation',
            ]);

            $candidate = DiscoveryCandidate::query()->create([
                'company_id' => $companyA,
                'discovery_search_id' => $search->getKey(),
                'external_place_id' => $place->getKey(),
                'candidate_type' => 'provider_candidate',
                'lifecycle_status' => 'new',
                'relevance_score' => 0.9,
                'confidence_score' => 0.8,
                'classification_evidence' => ['basis' => 'smoke'],
                'review_status' => 'pending',
            ]);

            CandidateMatch::query()->create([
                'company_id' => $companyA,
                'candidate_id' => $candidate->getKey(),
                'workcore_entity_type' => 'provider',
                'workcore_entity_id' => 'workcore-smoke-1',
                'match_score' => 0.75,
                'matching_fields' => ['name'],
                'conflicting_fields' => [],
                'match_strategy' => 'deterministic_weighted',
                'human_review_status' => 'pending',
            ]);

            CandidatePromotion::query()->create([
                'company_id' => $companyA,
                'candidate_id' => $candidate->getKey(),
                'target_entity_type' => 'provider',
                'target_entity_id' => 'provider-smoke-1',
                'accepted_fields' => ['name'],
                'rejected_fields' => [],
                'promoted_at' => now(),
            ]);

            MapsSuppression::query()->create([
                'company_id' => $companyA,
                'suppression_type' => 'provider_place_id',
                'normalised_value' => 'smoke-suppressed-place',
                'reason' => 'migration smoke test',
            ]);

            MapsUsageRecord::query()->create([
                'company_id' => $companyA,
                'provider' => 'smoke-provider',
                'operation' => 'search',
                'request_count' => 1,
                'result_count' => 1,
                'billable_units' => 1,
                'discovery_search_id' => $search->getKey(),
                'recorded_at' => now(),
            ]);

            MapLocation::query()->create([
                'company_id' => $companyA,
                'reference_type' => 'property',
                'public_reference_id' => 'property-smoke-1',
                'latitude' => -37.8136,
                'longitude' => 144.9631,
                'source' => 'manual',
                'precision' => 'rooftop',
                'coordinates_verified_at' => now(),
            ]);

            $ping = MapLocationPing::query()->create([
                'company_id' => $companyA,
                'worker_public_id' => 'worker-smoke-1',
                'user_id' => 'user-smoke-1',
                'latitude' => -37.8136,
                'longitude' => 144.9631,
                'accuracy_metres' => 8.5,
                'captured_at' => now(),
                'received_at' => now(),
                'dedupe_key' => hash('sha256', 'worker-smoke-1'),
            ]);

            MapWorkerTrackingState::query()->create([
                'company_id' => $companyA,
                'worker_public_id' => 'worker-smoke-1',
                'user_id' => 'user-smoke-1',
                'tracking_allowed' => true,
                'on_duty' => true,
                'latest_location_ping_id' => $ping->getKey(),
                'latest_captured_at' => now(),
                'last_received_at' => now(),
                'status_changed_at' => now(),
            ]);

            $analysis = TerritoryAnalysis::query()->create([
                'company_id' => $companyA,
                'discovery_search_id' => $search->getKey(),
                'search_area' => [],
                'categories' => ['plumber'],
                'analysis_type' => 'provider_coverage',
                'methodology_key' => 'provider_coverage_cells',
                'methodology_version' => '2.0',
                'area_square_km' => 25.0,
                'input_summary' => ['cell_count' => 1],
                'result_summary' => ['total_places' => 1],
                'generated_metrics' => [],
                'findings' => ['covered_cells' => 1],
                'source_coverage' => [],
                'confidence' => 0.8,
                'generated_at' => now(),
            ]);
            TerritoryAnalysisCell::query()->create([
                'company_id' => $companyA,
                'territory_analysis_id' => $analysis->getKey(),
                'cell_key' => 'smoke-cell-1',
                'center_latitude' => -37.8136,
                'center_longitude' => 144.9631,
                'north_boundary' => -37.79,
                'south_boundary' => -37.84,
                'east_boundary' => 144.99,
                'west_boundary' => 144.94,
                'area_square_km' => 25.0,
                'score' => 80.0,
                'confidence' => 0.8,
                'metrics' => ['covered' => true],
            ]);

            $routeSnapshot = RouteSnapshot::query()->create([
                'company_id' => $companyA,
                'request_signature' => hash('sha256', 'smoke-route'),
                'origin_latitude' => -37.8136,
                'origin_longitude' => 144.9631,
                'destination_latitude' => -37.8236,
                'destination_longitude' => 144.9731,
                'travel_mode' => 'DRIVE',
                'routing_preference' => 'TRAFFIC_AWARE',
                'provider' => 'smoke-provider',
                'result_basis' => 'provider_route',
                'road_distance_metres' => 2200,
                'straight_line_distance_metres' => 1400,
                'calculated_at' => now(),
                'stale_at' => now()->addMinutes(5),
            ]);
            EtaSnapshot::query()->create([
                'company_id' => $companyA,
                'route_snapshot_id' => $routeSnapshot->getKey(),
                'provider' => 'smoke-provider',
                'result_basis' => 'provider_route',
                'traffic_basis' => 'traffic_aware',
                'duration_seconds' => 600,
                'static_duration_seconds' => 480,
                'traffic_delay_seconds' => 120,
                'calculated_at' => now(),
                'stale_at' => now()->addMinutes(5),
            ]);

            self::assertSame(1, DiscoverySearch::query()->forCompany($companyA)->count());
            self::assertSame(1, DiscoveryRun::query()->forCompany($companyA)->count());
            self::assertSame(1, ExternalPlace::query()->forCompany($companyA)->count());
            self::assertSame(1, ExternalPlaceContact::query()->forCompany($companyA)->count());
            self::assertSame(1, FieldObservation::query()->forCompany($companyA)->count());
            self::assertSame(1, DiscoveryCandidate::query()->forCompany($companyA)->count());
            self::assertSame(1, CandidateMatch::query()->forCompany($companyA)->count());
            self::assertSame(1, CandidatePromotion::query()->forCompany($companyA)->count());
            self::assertSame(1, MapsSuppression::query()->forCompany($companyA)->count());
            self::assertSame(1, MapsUsageRecord::query()->forCompany($companyA)->count());
            self::assertSame(1, TerritoryAnalysis::query()->forCompany($companyA)->count());
            self::assertSame(1, TerritoryAnalysisCell::query()->forCompany($companyA)->count());
            self::assertSame(1, MapLocation::query()->forCompany($companyA)->count());
            self::assertSame(1, MapLocationPing::query()->forCompany($companyA)->count());
            self::assertSame(1, MapWorkerTrackingState::query()->forCompany($companyA)->count());
            self::assertSame(1, RouteSnapshot::query()->forCompany($companyA)->count());
            self::assertSame(1, EtaSnapshot::query()->forCompany($companyA)->count());
        } finally {
            DB::rollBack();
        }
    }
}
