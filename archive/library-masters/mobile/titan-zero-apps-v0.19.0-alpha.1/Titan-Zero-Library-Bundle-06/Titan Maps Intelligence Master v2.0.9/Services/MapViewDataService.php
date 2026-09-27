<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Models\DiscoveryCandidate;
use App\Extensions\TitanMapsIntelligence\Models\DiscoverySearch;
use App\Extensions\TitanMapsIntelligence\Models\ExternalPlace;
use App\Extensions\TitanMapsIntelligence\Models\MapLocation;
use App\Extensions\TitanMapsIntelligence\Models\MapLocationPing;
use App\Extensions\TitanMapsIntelligence\Models\MapWorkerTrackingState;
use App\Extensions\TitanMapsIntelligence\Models\MapGeofence;
use App\Extensions\TitanMapsIntelligence\Models\TerritoryAnalysis;
use App\Extensions\TitanMapsIntelligence\Models\ServiceTerritory;
use App\Extensions\TitanMapsIntelligence\Models\TerritoryEvaluation;
use App\Extensions\TitanMapsIntelligence\Models\RouteSnapshot;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Collection;

final class MapViewDataService
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly EncodedPolylineDecoder $polylineDecoder,
        private readonly MapsConfiguration $configuration,
        private readonly WorkerLocationVisibilityPolicy $workerVisibility,
    ) {}
    /** @return array<string,mixed>|null */
    public function forPage(string $companyId, string $page): ?array
    {
        if (str_starts_with($page, 'settings.')) {
            return null;
        }

        $payload = [
            'markers' => [],
            'polylines' => [],
            'polygons' => [],
            'circles' => [],
            'fit' => true,
            'empty_message' => 'No geocoded records are available for this map yet.',
        ];

        if ($page === 'field.team') {
            $payload['markers'] = $this->workerMarkers($companyId);
            $payload['empty_message'] = 'No on-duty workers currently have an accepted GPS position.';
            return $payload;
        }

        if ($page === 'field.geofences') {
            $payload['markers'] = $this->locationMarkers($companyId);
            [$polygons, $circles] = $this->geofenceShapes($companyId);
            $payload['polygons'] = $polygons;
            $payload['circles'] = $circles;
            $payload['draw'] = ['enabled' => true];
            $payload['empty_message'] = 'Draw a circle or polygon to create the first geofence.';
            return $payload;
        }

        if ($page === 'field.checkins') {
            [$markers, $polylines] = $this->checkInLayers($companyId);
            $payload['markers'] = $markers;
            $payload['polylines'] = $polylines;
            $payload['empty_message'] = 'No retained worker GPS history is available yet.';
            return $payload;
        }

        if (str_starts_with($page, 'field.')) {
            $payload['markers'] = $this->locationMarkers($companyId);
            return $payload;
        }

        if (str_starts_with($page, 'location.')) {
            $payload['markers'] = $this->locationIntelligenceMarkers($companyId, $page);
            $payload['circles'] = $this->recentSearchCircles($companyId);
            $payload['empty_message'] = 'Run a discovery search or geocode company locations to populate this map.';
            return $payload;
        }

        if (str_starts_with($page, 'territories.')) {
            $payload['markers'] = in_array($page, ['territories.travel-zones','territories.geographic-pricing'], true)
                ? $this->territoryBranchMarkers($companyId)
                : $this->territoryMarkers($companyId, $page);
            [$polygons, $circles] = $this->territoryShapes($companyId);
            $analyticsPolygons = $this->territoryAnalyticsPolygons($companyId, $page);
            $payload['polygons'] = array_merge($polygons, $analyticsPolygons);
            $payload['circles'] = $circles;
            if ($page === 'territories.geographic-pricing') {
                [$evaluationMarkers, $evaluationLines] = $this->latestTerritoryEvaluationLayers($companyId);
                $payload['markers'] = array_merge($payload['markers'], $evaluationMarkers);
                $payload['polylines'] = array_merge($payload['polylines'], $evaluationLines);
            }
            if ($page === 'territories.service-areas') $payload['draw'] = ['enabled' => true];
            $payload['empty_message'] = $page === 'territories.service-areas'
                ? 'Draw a service-area circle or polygon, or create a postcode/suburb rule.'
                : 'No mappable territory or branch evidence is available yet.';
            return $payload;
        }

        if (str_starts_with($page, 'travel.')) {
            $payload['markers'] = $this->travelReferenceMarkers($companyId);
            $payload['polylines'] = in_array($page, ['travel.index','travel.route','travel.traffic'], true) ? $this->recentRoutePolylines($companyId) : [];
            $payload['empty_message'] = 'Geocode jobs, branches, workers or suppliers to use them as routing reference points.';
            return $payload;
        }

        return null;
    }

    /** @return array<int,array<string,mixed>> */
    private function locationMarkers(string $companyId): array
    {
        return MapLocation::query()->forCompany($companyId)
            ->whereNotNull('latitude')->whereNotNull('longitude')
            ->where('reference_type', '!=', 'worker')
            ->latest('coordinates_verified_at')->limit(500)->get()
            ->map(fn (MapLocation $location): array => $this->mapLocationMarker($location))
            ->values()->all();
    }

    /** @return array<int,array<string,mixed>> */
    private function workerMarkers(string $companyId): array
    {
        $states = MapWorkerTrackingState::query()->forCompany($companyId)
            ->where('on_duty', true)->where('tracking_allowed', true)->get()->keyBy('worker_public_id');

        if (! $this->workerVisibility->canReadCompanyWide($companyId)) {
            $states = $states->where('user_id', $this->context->userId());
        }

        return MapLocation::query()->forCompany($companyId)
            ->where('reference_type', 'worker')->where('source', 'gps')
            ->whereNotNull('latitude')->whereNotNull('longitude')
            ->where('coordinates_verified_at', '>=', now()->subSeconds($this->configuration->workerLocationStaleAfterSeconds()))
            ->whereIn('public_reference_id', $states->keys())
            ->latest('coordinates_verified_at')->limit(250)->get()
            ->map(function (MapLocation $location) use ($states): array {
                $state = $states->get((string) $location->public_reference_id);
                return [
                    'id' => 'worker:'.$location->public_reference_id,
                    'lat' => (float) $location->latitude,
                    'lng' => (float) $location->longitude,
                    'type' => 'worker',
                    'label' => 'Worker '.$location->public_reference_id,
                    'subtitle' => 'On duty · '.($location->coordinates_verified_at?->diffForHumans() ?? 'location recorded'),
                    'status' => ($state?->tracking_allowed ?? false) ? 'tracking' : 'paused',
                    'meta' => [
                        'precision' => $location->precision,
                        'captured_at' => $location->coordinates_verified_at?->toAtomString(),
                    ],
                ];
            })->values()->all();
    }

    /** @return array{0:array<int,array<string,mixed>>,1:array<int,array<string,mixed>>} */
    private function checkInLayers(string $companyId): array
    {
        $query = MapLocationPing::query()->forCompany($companyId)->latest('captured_at');
        if (! $this->workerVisibility->canReadCompanyWide($companyId)) {
            $query->where('user_id', $this->context->userId());
        } else {
            $sharedWorkers = MapWorkerTrackingState::query()->forCompany($companyId)
                ->where('tracking_allowed', true)
                ->where('share_history_until', '>=', now())
                ->pluck('worker_public_id');
            $query->whereIn('worker_public_id', $sharedWorkers);
        }
        $pings = $query->limit(300)->get()->sortBy('captured_at')->values();

        $markers = $pings->map(static fn (MapLocationPing $ping): array => [
            'id' => 'ping:'.$ping->id,
            'lat' => (float) $ping->latitude,
            'lng' => (float) $ping->longitude,
            'type' => 'checkin',
            'label' => 'Worker '.$ping->worker_public_id,
            'subtitle' => $ping->captured_at?->format('Y-m-d H:i:s') ?? 'GPS sample',
            'status' => 'accepted',
            'meta' => ['accuracy_metres' => (float) $ping->accuracy_metres],
        ])->all();

        $polylines = [];
        foreach ($pings->groupBy('worker_public_id') as $workerId => $workerPings) {
            $points = $workerPings->map(static fn (MapLocationPing $ping): array => [
                'lat' => (float) $ping->latitude,
                'lng' => (float) $ping->longitude,
            ])->values()->all();
            if (count($points) > 1) {
                $polylines[] = ['id' => 'worker-path:'.$workerId, 'type' => 'worker_path', 'points' => $points];
            }
        }

        return [$markers, $polylines];
    }

    /** @return array<int,array<string,mixed>> */
    private function locationIntelligenceMarkers(string $companyId, string $page): array
    {
        $candidateTypes = match ($page) {
            'location.suppliers' => ['supplier_candidate'],
            'location.contractors' => ['contractor_candidate', 'provider_candidate', 'emergency_provider'],
            'location.competitors' => ['competitor'],
            default => [],
        };

        if ($candidateTypes !== [] || $page === 'location.candidates') {
            $query = DiscoveryCandidate::query()->forCompany($companyId)->with('place')->latest('created_at');
            if ($candidateTypes !== []) {
                $query->whereIn('candidate_type', $candidateTypes);
            }
            return $query->limit(500)->get()->map(function (DiscoveryCandidate $candidate): ?array {
                $place = $candidate->place;
                if ($place === null || $place->latitude === null || $place->longitude === null) {
                    return null;
                }
                return $this->externalPlaceMarker($place, (string) $candidate->candidate_type, [
                    'candidate_status' => $candidate->review_status ?? $candidate->lifecycle_status,
                    'relevance_score' => $candidate->relevance_score,
                ]);
            })->filter()->values()->all();
        }

        return ExternalPlace::query()->forCompany($companyId)
            ->whereNotNull('latitude')->whereNotNull('longitude')
            ->latest('last_observed_at')->limit(500)->get()
            ->map(fn (ExternalPlace $place): array => $this->externalPlaceMarker($place, 'place'))
            ->values()->all();
    }

    /** @return array<int,array<string,mixed>> */
    private function territoryMarkers(string $companyId, string $page): array
    {
        $type = match ($page) {
            'territories.suppliers' => 'supplier_candidate',
            'territories.competitors' => 'competitor',
            default => null,
        };

        if ($type !== null) {
            return DiscoveryCandidate::query()->forCompany($companyId)->with('place')
                ->where('candidate_type', $type)->latest('created_at')->limit(500)->get()
                ->map(function (DiscoveryCandidate $candidate) use ($type): ?array {
                    return $candidate->place ? $this->externalPlaceMarker($candidate->place, $type) : null;
                })->filter()->values()->all();
        }

        return ExternalPlace::query()->forCompany($companyId)
            ->whereNotNull('latitude')->whereNotNull('longitude')
            ->latest('last_observed_at')->limit(500)->get()
            ->map(fn (ExternalPlace $place): array => $this->externalPlaceMarker($place, 'provider'))
            ->values()->all();
    }

    /** @return array<int,array<string,mixed>> */
    private function territoryAnalyticsPolygons(string $companyId, string $page): array
    {
        $type = match ($page) {
            'territories.providers' => 'provider_coverage',
            'territories.competitors' => 'competitor_density',
            'territories.suppliers' => 'supplier_coverage',
            'territories.gaps' => 'service_gap',
            'territories.branch-coverage' => 'branch_coverage',
            'territories.expansion-opportunities' => 'expansion_opportunity',
            default => null,
        };
        if ($type === null) return [];
        $analysis = TerritoryAnalysis::query()->forCompany($companyId)->with('cells')->where('analysis_type',$type)->latest('generated_at')->first();
        if ($analysis === null) return [];
        $overallDensity = (float) data_get($analysis->generated_metrics, 'competitors_per_square_km', 0.0);
        return $analysis->cells->map(function ($cell) use ($analysis, $type, $overallDensity): array {
            $metrics=(array)($cell->metrics??[]);$score=$cell->score!==null?(float)$cell->score:null;
            $layerType = match ($type) {
                'provider_coverage' => (bool)($metrics['covered']??false) ? 'analytics_positive' : 'analytics_gap',
                'competitor_density' => (float)($metrics['competitors_per_square_km']??0) > $overallDensity ? 'analytics_gap' : 'analytics_positive',
                'supplier_coverage' => ($metrics['travel_time_status']??'unavailable') === 'unavailable' ? 'analytics_gap' : (in_array($metrics['travel_time_band']??'', ['0_15_minutes','15_30_minutes'], true) ? 'analytics_positive' : 'analytics_warning'),
                'service_gap' => ($score??0) >= 65 ? 'analytics_gap' : (($score??0)>=35?'analytics_warning':'analytics_positive'),
                'branch_coverage' => (bool)($metrics['assigned']??false) ? 'analytics_positive' : 'analytics_gap',
                'expansion_opportunity' => ($score??0) >= 60 ? 'analytics_opportunity' : (($score??0)>=35?'analytics_warning':'analytics_neutral'),
                default => 'analytics_neutral',
            };
            return [
                'id'=>'territory-analytics-cell:'.$cell->id,'type'=>$layerType,
                'label'=>str_replace('_',' ',(string)$analysis->analysis_type).' · '.$cell->cell_key,
                'points'=>[
                    ['lat'=>(float)$cell->north_boundary,'lng'=>(float)$cell->west_boundary],
                    ['lat'=>(float)$cell->north_boundary,'lng'=>(float)$cell->east_boundary],
                    ['lat'=>(float)$cell->south_boundary,'lng'=>(float)$cell->east_boundary],
                    ['lat'=>(float)$cell->south_boundary,'lng'=>(float)$cell->west_boundary],
                ],
                'meta'=>['score'=>$score,'confidence'=>$cell->confidence,'methodology_key'=>$analysis->methodology_key,'methodology_version'=>$analysis->methodology_version,'metrics'=>$metrics],
            ];
        })->values()->all();
    }

    /** @return array{0:array<int,array<string,mixed>>,1:array<int,array<string,mixed>>} */
    private function territoryShapes(string $companyId): array
    {
        $polygons = [];
        $circles = [];

        foreach (ServiceTerritory::query()->forCompany($companyId)->where('status','active')->orderByDesc('priority')->limit(250)->get() as $territory) {
            $type = $territory->effect === 'exclude' ? 'service_territory_exclude' : 'service_territory_include';
            $base = [
                'id' => 'service-territory:'.$territory->id,
                'type' => $type,
                'label' => (string) $territory->name,
                'meta' => [
                    'effect' => $territory->effect,
                    'match_mode' => $territory->match_mode,
                    'priority' => (int) $territory->priority,
                    'branch_public_id' => $territory->branch_public_id,
                ],
            ];
            if ($territory->match_mode === 'circle' && $territory->center_latitude !== null && $territory->center_longitude !== null && (float)$territory->radius_metres > 0) {
                $circles[] = $base + ['lat'=>(float)$territory->center_latitude,'lng'=>(float)$territory->center_longitude,'radius_metres'=>(float)$territory->radius_metres];
            } elseif ($territory->match_mode === 'polygon') {
                $points = $this->normalisePoints((array)($territory->geometry ?? []));
                if (count($points) >= 3) $polygons[] = $base + ['points'=>$points];
            }
        }

        foreach (TerritoryAnalysis::query()->forCompany($companyId)->latest('generated_at')->limit(30)->get() as $analysis) {
            $area = (array) ($analysis->search_area ?? []);
            $label = str_replace('_', ' ', (string) $analysis->analysis_type);
            $polygon = $area['polygon'] ?? $area['coordinates'] ?? null;
            if (is_array($polygon)) {
                $points = $this->normalisePoints($polygon);
                if (count($points) >= 3) {
                    $polygons[] = ['id' => 'analysis-territory:'.$analysis->id, 'type' => 'territory_analysis', 'label' => $label, 'points' => $points];
                    continue;
                }
            }
            $lat = $area['latitude'] ?? $area['center_latitude'] ?? null;
            $lng = $area['longitude'] ?? $area['center_longitude'] ?? null;
            $radius = $area['radius_metres'] ?? $area['radius'] ?? null;
            if (is_numeric($lat) && is_numeric($lng) && is_numeric($radius) && (float) $radius > 0) {
                $circles[] = ['id'=>'analysis-territory:'.$analysis->id,'type'=>'territory_analysis','label'=>$label,'lat'=>(float)$lat,'lng'=>(float)$lng,'radius_metres'=>(float)$radius];
            }
        }
        return [$polygons, $circles];
    }

    /** @return array<int,array<string,mixed>> */
    private function territoryBranchMarkers(string $companyId): array
    {
        return MapLocation::query()->forCompany($companyId)
            ->where('reference_type','branch')->whereNotNull('latitude')->whereNotNull('longitude')
            ->latest('coordinates_verified_at')->limit(100)->get()
            ->map(fn (MapLocation $location): array => $this->mapLocationMarker($location))->values()->all();
    }

    /** @return array{0:array<int,array<string,mixed>>,1:array<int,array<string,mixed>>} */
    private function latestTerritoryEvaluationLayers(string $companyId): array
    {
        $evaluation = TerritoryEvaluation::query()->forCompany($companyId)->latest('evaluated_at')->first();
        if ($evaluation === null || $evaluation->target_latitude === null || $evaluation->target_longitude === null) return [[], []];
        $markers = [[
            'id'=>'territory-evaluation:'.$evaluation->id,
            'lat'=>(float)$evaluation->target_latitude,'lng'=>(float)$evaluation->target_longitude,
            'type'=>$evaluation->covered ? 'territory_target_covered' : 'territory_target_outside',
            'label'=>$evaluation->covered ? 'Covered target' : 'Outside / excluded target',
            'subtitle'=>'Latest territory evaluation',
            'meta'=>['branch_public_id'=>$evaluation->branch_public_id,'distance_basis'=>$evaluation->distance_basis,'eta_basis'=>$evaluation->eta_basis],
        ]];
        $lines = [];
        if ($evaluation->route_snapshot_id) {
            $route = RouteSnapshot::query()->forCompany($companyId)->whereKey((string)$evaluation->route_snapshot_id)->first();
            if ($route) {
                $points = $this->polylineDecoder->decode($route->encoded_polyline);
                if (count($points) < 2) $points = [
                    ['lat'=>(float)$route->origin_latitude,'lng'=>(float)$route->origin_longitude],
                    ['lat'=>(float)$route->destination_latitude,'lng'=>(float)$route->destination_longitude],
                ];
                $lines[] = ['id'=>'territory-evaluation-route:'.$evaluation->id,'type'=>$route->result_basis==='provider_route'?'route_history':($route->result_basis==='last_valid_snapshot'?'route_history_stale':'route_estimate'),'points'=>$points];
            }
        }
        return [$markers,$lines];
    }

    /** @return array{0:array<int,array<string,mixed>>,1:array<int,array<string,mixed>>} */
    private function geofenceShapes(string $companyId): array
    {
        $polygons = []; $circles = [];
        foreach (MapGeofence::query()->forCompany($companyId)->where('enabled', true)->latest('updated_at')->limit(250)->get() as $geofence) {
            $base = ['id'=>'geofence:'.$geofence->id,'type'=>'geofence','label'=>$geofence->name,'meta'=>['reference_type'=>$geofence->reference_type,'public_reference_id'=>$geofence->public_reference_id,'dwell_seconds'=>$geofence->dwell_seconds]];
            if ($geofence->shape_type === 'circle' && $geofence->center_latitude !== null && $geofence->center_longitude !== null && (float) $geofence->radius_metres > 0) {
                $circles[] = $base + ['lat'=>(float)$geofence->center_latitude,'lng'=>(float)$geofence->center_longitude,'radius_metres'=>(float)$geofence->radius_metres];
            } elseif ($geofence->shape_type === 'polygon') {
                $points = $this->normalisePoints((array) ($geofence->geometry ?? []));
                if (count($points) >= 3) $polygons[] = $base + ['points'=>$points];
            }
        }
        return [$polygons,$circles];
    }

    /** @return array<int,array<string,mixed>> */
    private function recentSearchCircles(string $companyId): array
    {
        return DiscoverySearch::query()->forCompany($companyId)
            ->whereNotNull('latitude')->whereNotNull('longitude')->whereNotNull('radius_metres')
            ->latest('created_at')->limit(10)->get()
            ->map(static fn (DiscoverySearch $search): array => [
                'id' => 'search:'.$search->id,
                'type' => 'search_radius',
                'label' => $search->query ?: 'Discovery search',
                'lat' => (float) $search->latitude,
                'lng' => (float) $search->longitude,
                'radius_metres' => (float) $search->radius_metres,
            ])->values()->all();
    }

    /** @return array<int,array<string,mixed>> */
    private function travelReferenceMarkers(string $companyId): array
    {
        return MapLocation::query()->forCompany($companyId)
            ->whereNotNull('latitude')->whereNotNull('longitude')
            ->whereIn('reference_type', ['branch', 'job', 'property', 'supplier', 'contractor'])
            ->latest('coordinates_verified_at')->limit(300)->get()
            ->map(fn (MapLocation $location): array => $this->mapLocationMarker($location))
            ->values()->all();
    }


    /** @return array<int,array<string,mixed>> */
    private function recentRoutePolylines(string $companyId): array
    {
        return RouteSnapshot::query()->forCompany($companyId)
            ->latest('created_at')->limit(12)->get()
            ->map(function (RouteSnapshot $route): ?array {
                $points = $this->polylineDecoder->decode($route->encoded_polyline);
                if (count($points) < 2) {
                    $points = [
                        ['lat' => (float) $route->origin_latitude, 'lng' => (float) $route->origin_longitude],
                        ['lat' => (float) $route->destination_latitude, 'lng' => (float) $route->destination_longitude],
                    ];
                }
                return [
                    'id' => 'route-history:'.$route->id,
                    'type' => match ((string) $route->result_basis) {
                        'provider_route' => 'route_history',
                        'last_valid_snapshot' => 'route_history_stale',
                        default => 'route_estimate',
                    },
                    'points' => $points,
                ];
            })->filter()->values()->all();
    }

    /** @param array<string,mixed> $extra */
    private function externalPlaceMarker(ExternalPlace $place, string $type, array $extra = []): array
    {
        return [
            'id' => 'place:'.$place->id,
            'lat' => (float) $place->latitude,
            'lng' => (float) $place->longitude,
            'type' => $type,
            'label' => $place->name ?: 'Observed place',
            'subtitle' => $place->address ?: $place->primary_category,
            'status' => $place->currently_open ? 'open_now' : ($place->permanently_closed ? 'closed' : ($place->temporarily_closed ? 'temporarily_closed' : 'observed')),
            'meta' => array_filter([
                'rating' => $place->rating,
                'review_count' => $place->review_count,
                'phone' => $place->phone,
                'website' => $place->website,
                'provider' => $place->provider,
            ] + $extra, static fn ($value): bool => $value !== null && $value !== ''),
        ];
    }

    private function mapLocationMarker(MapLocation $location): array
    {
        return [
            'id' => 'location:'.$location->id,
            'lat' => (float) $location->latitude,
            'lng' => (float) $location->longitude,
            'type' => (string) $location->reference_type,
            'label' => ucfirst(str_replace('_', ' ', (string) $location->reference_type)).' '.$location->public_reference_id,
            'subtitle' => $location->formatted_address ?: 'Titan operational location',
            'status' => $location->source ?: 'recorded',
            'meta' => array_filter([
                'source' => $location->source,
                'precision' => $location->precision,
                'provider' => $location->provider,
                'verified_at' => $location->coordinates_verified_at?->toAtomString(),
            ], static fn ($value): bool => $value !== null && $value !== ''),
        ];
    }

    /** @param array<int,mixed> $raw @return array<int,array{lat:float,lng:float}> */
    private function normalisePoints(array $raw): array
    {
        $points = [];
        foreach ($raw as $point) {
            if (is_array($point) && isset($point['lat'], $point['lng']) && is_numeric($point['lat']) && is_numeric($point['lng'])) {
                $points[] = ['lat' => (float) $point['lat'], 'lng' => (float) $point['lng']];
                continue;
            }
            if (is_array($point) && count($point) >= 2 && is_numeric($point[0]) && is_numeric($point[1])) {
                $points[] = ['lat' => (float) $point[0], 'lng' => (float) $point[1]];
            }
        }
        return $points;
    }
}
