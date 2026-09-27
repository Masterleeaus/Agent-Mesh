<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\RouteMatrixRequest;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Models\MapLocation;
use App\Extensions\TitanMapsIntelligence\Models\DiscoveryCandidate;
use App\Extensions\TitanMapsIntelligence\Models\MapWorkerTrackingState;
use Illuminate\Support\Facades\Gate;
use Illuminate\Auth\Access\AuthorizationException;

final class NearestResourceService
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly TravelMatrixService $matrices,
        private readonly MapsConfiguration $configuration,
        private readonly GeoDistanceService $distance,
        private readonly PermissionAuthorizer $authorizer,
        private readonly WorkerLocationVisibilityPolicy $workerVisibility,
    ) {}

    /** @return array<string,mixed> */
    public function find(Coordinates $origin, string $resourceType = 'all', int $limit = 10, string $travelMode = 'DRIVE', string $routingPreference = 'TRAFFIC_AWARE'): array
    {
        if (!in_array($resourceType, ['all','worker','supplier','contractor'], true)) {
            throw MapsIntelligenceException::fromCode('MAPS_INVALID_RESOURCE_TYPE', 'Nearest resource type must be worker, supplier, contractor or all.');
        }
        if ($limit < 1 || $limit > $this->configuration->nearestResourceLimit()) {
            throw MapsIntelligenceException::fromCode('MAPS_NEAREST_LIMIT_EXCEEDED', sprintf('Nearest resource limit must be between 1 and %d.', $this->configuration->nearestResourceLimit()));
        }

        $resources = $this->candidates($origin, $resourceType);
        if ($resources === []) return ['basis'=>'none','provider'=>null,'cache_status'=>'none','origin'=>['lat'=>$origin->latitude,'lng'=>$origin->longitude],'resources'=>[]];

        $resources = array_slice($resources, 0, $this->configuration->nearestCandidatePool());
        $destinations = array_map(static fn (array $row): Coordinates => new Coordinates((float)$row['lat'], (float)$row['lng']), $resources);
        $refs = array_map(static fn (array $row): array => ['reference_type'=>$row['type'],'public_reference_id'=>$row['public_reference_id'],'label'=>$row['label']], $resources);
        $calculation = $this->matrices->calculate(new RouteMatrixRequest([$origin], $destinations, $travelMode, $routingPreference), [['label'=>'Origin']], $refs);
        $snapshot = $calculation['snapshot'];
        $byIndex = [];
        foreach ($snapshot->elements as $element) $byIndex[(int)$element->destination_index] = $element;

        foreach ($resources as $index => &$resource) {
            $element = $byIndex[$index] ?? null;
            $resource['distance_metres'] = $element?->distance_metres;
            $resource['straight_line_distance_metres'] = $element?->straight_line_distance_metres ?? $resource['straight_line_distance_metres'];
            $resource['duration_seconds'] = $element?->duration_seconds;
            $resource['static_duration_seconds'] = $element?->static_duration_seconds;
            $resource['traffic_delay_seconds'] = $element?->traffic_delay_seconds;
            $resource['condition'] = $element?->condition ?? 'UNAVAILABLE';
            $resource['distance_basis'] = $element?->distance_metres !== null ? 'road_distance' : 'straight_line_estimate';
            $resource['eta_basis'] = $element?->duration_seconds !== null ? ($snapshot->result_basis === 'stale_matrix_snapshot' ? 'stale_snapshot' : 'provider_eta') : 'unavailable';
        }
        unset($resource);

        usort($resources, static function (array $a, array $b): int {
            $aEta = $a['duration_seconds'] ?? PHP_INT_MAX; $bEta = $b['duration_seconds'] ?? PHP_INT_MAX;
            if ($aEta !== $bEta) return $aEta <=> $bEta;
            $aDistance = $a['distance_metres'] ?? $a['straight_line_distance_metres'] ?? PHP_INT_MAX;
            $bDistance = $b['distance_metres'] ?? $b['straight_line_distance_metres'] ?? PHP_INT_MAX;
            return $aDistance <=> $bDistance;
        });

        return [
            'basis'=>(string)$snapshot->result_basis,'provider'=>$snapshot->provider,'cache_status'=>$calculation['cache_status'],
            'freshness_status'=>$snapshot->result_basis === 'provider_matrix' ? 'fresh' : ($snapshot->result_basis === 'stale_matrix_snapshot' ? 'stale' : 'estimate'),
            'origin'=>['lat'=>$origin->latitude,'lng'=>$origin->longitude],
            'resources'=>array_slice($resources,0,$limit),
            'matrix_snapshot_id'=>(string)$snapshot->id,
            'provider_error_code'=>$snapshot->provider_error_code,
        ];
    }

    /** @return array<int,array<string,mixed>> */
    private function candidates(Coordinates $origin, string $resourceType): array
    {
        $companyId = $this->context->companyId();
        $types = $resourceType === 'all' ? ['worker','supplier','contractor'] : [$resourceType];
        $rows = [];

        foreach ($types as $type) {
            if ($type === 'worker') {
                try {
                    $this->authorizer->authorize($this->context->userId(), $companyId, 'titan-maps-intelligence.worker-location.read', ['operation' => 'nearest_resource']);
                } catch (AuthorizationException $exception) {
                    if ($resourceType === 'worker') throw $exception;
                    continue;
                }
                $states = MapWorkerTrackingState::query()->forCompany($companyId)->where('tracking_allowed',true)->where('on_duty',true);
                if (! $this->workerVisibility->canReadCompanyWide($companyId)) $states->where('user_id',$this->context->userId());
                $workerIds = $states->pluck('worker_public_id')->all();
                if ($workerIds === []) continue;
                $locations = MapLocation::query()->forCompany($companyId)->where('reference_type','worker')->where('source','gps')
                    ->where('coordinates_verified_at','>=',now()->subSeconds($this->configuration->workerLocationStaleAfterSeconds()))
                    ->whereIn('public_reference_id',$workerIds)->get();
            } else {
                $locations = MapLocation::query()->forCompany($companyId)->where('reference_type',$type)->whereNotNull('latitude')->whereNotNull('longitude')->get();
            }
            foreach ($locations as $location) {
                if ($location->latitude === null || $location->longitude === null) continue;
                $straight = (int)round($this->distance->kilometres($origin->latitude,$origin->longitude,(float)$location->latitude,(float)$location->longitude)*1000);
                $rows[] = [
                    'type'=>$type,'public_reference_id'=>(string)$location->public_reference_id,
                    'label'=>ucfirst($type).' '.(string)$location->public_reference_id,
                    'subtitle'=>$location->formatted_address ?: ($type === 'worker' ? 'On-duty live position' : 'Titan operational location'),
                    'lat'=>(float)$location->latitude,'lng'=>(float)$location->longitude,
                    'straight_line_distance_metres'=>$straight,'source'=>'canonical_location',
                ];
            }

            if (in_array($type, ['supplier','contractor'], true)) {
                $candidateTypes = $type === 'supplier' ? ['supplier_candidate'] : ['contractor_candidate','provider_candidate','emergency_provider'];
                $candidates = DiscoveryCandidate::query()->forCompany($companyId)->with('place')
                    ->where('review_status','approved')->whereIn('candidate_type',$candidateTypes)
                    ->whereHas('place', function ($query): void {
                        $query->where(function ($q): void { $q->whereNull('permanently_closed')->orWhere('permanently_closed',false); })
                            ->where(function ($q): void { $q->whereNull('temporarily_closed')->orWhere('temporarily_closed',false); })
                            ->where(function ($q): void { $q->whereNull('currently_open')->orWhere('currently_open',true); });
                    })
                    ->latest('approved_at')->limit(100)->get();
                foreach ($candidates as $candidate) {
                    $place = $candidate->place;
                    if ($place === null || $place->latitude === null || $place->longitude === null) continue;
                    $straight = (int)round($this->distance->kilometres($origin->latitude,$origin->longitude,(float)$place->latitude,(float)$place->longitude)*1000);
                    $rows[] = [
                        'type'=>$type,'public_reference_id'=>(string)$candidate->id,
                        'label'=>$place->name ?: ucfirst($type).' candidate',
                        'subtitle'=>$place->address ?: 'Approved Maps discovery candidate',
                        'lat'=>(float)$place->latitude,'lng'=>(float)$place->longitude,
                        'straight_line_distance_metres'=>$straight,'source'=>'approved_discovery_candidate',
                    ];
                }
            }
        }
        usort($rows, static fn(array $a,array $b): int => $a['straight_line_distance_metres'] <=> $b['straight_line_distance_metres']);
        return $rows;
    }
}
