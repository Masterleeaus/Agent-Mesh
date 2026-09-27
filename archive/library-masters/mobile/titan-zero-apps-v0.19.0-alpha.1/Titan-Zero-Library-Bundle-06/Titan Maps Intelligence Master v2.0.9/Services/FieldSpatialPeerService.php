<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\FieldSpatialPeerGateway;
use App\Extensions\TitanMapsIntelligence\Models\TerritoryEvaluation;
use App\Extensions\TitanMapsIntelligence\Models\RouteSnapshot;
use App\Extensions\TitanMapsIntelligence\Contracts\FieldReferenceGateway;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\RouteRequest;
use App\Extensions\TitanMapsIntelligence\DTO\WorkerLocationPing;
use DateTimeImmutable;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Route;
use InvalidArgumentException;

/** Maps-owned, bounded peer API consumed by Titan Field when both extensions are installed. */
final class FieldSpatialPeerService implements FieldSpatialPeerGateway
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly PermissionAuthorizer $permissions,
        private readonly FieldReferenceGateway $references,
        private readonly RouteCalculationService $routes,
        private readonly WorkerTrackingService $tracking,
        private readonly OfflineWorkerLocationSyncService $offlineLocations,
        private readonly MapViewDataService $mapViews,
        private readonly MapsConfiguration $configuration,
        private readonly NearestResourceService $nearestResources,
        private readonly FieldRouteOptimizationProposalService $routeOptimisationProposals,
    ) {}

    public function healthy(string $companyId): bool
    {
        $this->assertCompany($companyId);
        return Schema::hasTable('maps_worker_tracking_states') && Schema::hasTable('map_locations');
    }

    public function latestWorkerPositions(string $companyId, array $workerUserIds = []): array
    {
        $this->assertCompany($companyId);
        $this->permissions->authorize($this->context->userId(), $companyId, 'titan-maps-intelligence.worker-location.read', ['peer'=>'titan-field']);
        if (! $this->healthy($companyId)) return [];

        $ids = array_values(array_unique(array_filter(array_map(static fn($v): string => trim((string)$v), $workerUserIds))));
        $states = \App\Extensions\TitanMapsIntelligence\Models\MapWorkerTrackingState::query()
            ->forCompany($companyId)->where('tracking_allowed', true)->where('on_duty', true)
            ->when($ids !== [], fn($q) => $q->whereIn('user_id', $ids))->get()->keyBy('worker_public_id');
        if ($states->isEmpty()) return [];

        return \App\Extensions\TitanMapsIntelligence\Models\MapLocation::query()->forCompany($companyId)
            ->where('reference_type','worker')->where('source','gps')->whereIn('public_reference_id',$states->keys())
            ->where('coordinates_verified_at','>=',now()->subSeconds($this->configuration->workerLocationStaleAfterSeconds()))
            ->whereNotNull('latitude')->whereNotNull('longitude')->latest('coordinates_verified_at')->get()
            ->map(function($location) use ($states): array {
                $state = $states->get((string)$location->public_reference_id);
                return [
                    'worker_user_id' => (string)($state?->user_id ?? ''),
                    'worker_public_id' => (string)$location->public_reference_id,
                    'latitude' => (float)$location->latitude,
                    'longitude' => (float)$location->longitude,
                    'captured_at' => $location->coordinates_verified_at?->toAtomString(),
                    'precision' => $location->precision,
                    'provider' => $location->provider,
                    'tracking_allowed' => (bool)($state?->tracking_allowed ?? false),
                    'on_duty' => (bool)($state?->on_duty ?? false),
                    'source' => 'titan-maps-intelligence',
                ];
            })->values()->all();
    }

    public function estimateTravel(string $companyId, array $origin, array $destination, array $context = []): array
    {
        $this->assertCompany($companyId);
        $this->permissions->authorize($this->context->userId(), $companyId, 'titan-maps-intelligence.route.calculate', ['peer'=>'titan-field']);
        $request = new RouteRequest(
            new Coordinates((float)($origin['latitude'] ?? 0), (float)($origin['longitude'] ?? 0)),
            new Coordinates((float)($destination['latitude'] ?? 0), (float)($destination['longitude'] ?? 0)),
            (string)($context['travel_mode'] ?? 'DRIVE'),
            (string)($context['routing_preference'] ?? 'TRAFFIC_AWARE'),
            workerPublicId: isset($context['worker_public_id']) ? (string)$context['worker_public_id'] : null,
            originReferenceType: isset($context['origin_reference_type']) ? (string)$context['origin_reference_type'] : null,
            originPublicReferenceId: isset($context['origin_public_reference_id']) ? (string)$context['origin_public_reference_id'] : null,
            destinationReferenceType: isset($context['destination_reference_type']) ? (string)$context['destination_reference_type'] : null,
            destinationPublicReferenceId: isset($context['destination_public_reference_id']) ? (string)$context['destination_public_reference_id'] : null,
        );
        $result = $this->routes->calculate($request);
        return [
            'provider' => 'titan-maps-intelligence',
            'basis' => $result->basis,
            'road_distance_meters' => $result->roadDistanceMetres,
            'straight_line_distance_meters' => $result->straightLineDistanceMetres,
            'duration_seconds' => $result->durationSeconds,
            'traffic_delay_seconds' => $result->trafficDelaySeconds,
            'eta_basis' => $result->etaBasis(),
            'freshness' => $result->freshnessStatus(),
            'encoded_polyline' => $result->encodedPolyline,
            'route_snapshot_id' => $result->routeSnapshotId,
            'eta_snapshot_id' => $result->etaSnapshotId,
            'valid_until' => $result->validUntil?->format(DATE_ATOM),
        ];
    }

    public function recordWorkerLocation(string $companyId, string $userId, array $payload): array
    {
        $this->assertCompany($companyId);
        if (! hash_equals($this->context->userId(), $userId)) throw new InvalidArgumentException('Titan Maps peer user context mismatch.');
        $this->permissions->authorize($userId, $companyId, 'titan-maps-intelligence.worker-location.write', ['peer'=>'titan-field']);
        $capturedAt = isset($payload['captured_at']) && trim((string)$payload['captured_at']) !== '' ? new DateTimeImmutable((string)$payload['captured_at']) : new DateTimeImmutable('now');
        $ping = new WorkerLocationPing(
            (float)($payload['latitude'] ?? 0), (float)($payload['longitude'] ?? 0), (float)($payload['accuracy_meters'] ?? 0), $capturedAt,
            isset($payload['altitude_meters']) ? (float)$payload['altitude_meters'] : null,
            isset($payload['speed_mps']) ? (float)$payload['speed_mps'] : null,
            isset($payload['heading_degrees']) ? (float)$payload['heading_degrees'] : null,
            ['route_public_id'=>$payload['route_public_id']??null,'appointment_public_id'=>$payload['appointment_public_id']??null,'source'=>'titan-field-peer'],
        );
        $result = $this->tracking->ingest($ping, isset($payload['worker_public_id']) ? (string)$payload['worker_public_id'] : null, isset($payload['device_id']) ? (string)$payload['device_id'] : null);
        return [
            'provider'=>'titan-maps-intelligence','stored'=>$result->stored,'deduplicated'=>$result->deduplicated,
            'location_id'=>$result->location?->id,'ping_id'=>$result->ping?->id,'captured_at'=>$capturedAt->format(DATE_ATOM),
        ];
    }

    public function syncOfflineWorkerLocations(string $companyId, string $userId, array $samples, array $context = []): array
    {
        $this->assertCompany($companyId);
        if (! hash_equals($this->context->userId(), $userId)) throw new InvalidArgumentException('Titan Maps offline peer user context mismatch.');
        $this->permissions->authorize($userId, $companyId, 'titan-maps-intelligence.worker-location.write', ['peer'=>'titan-field','purpose'=>'offline-sync']);
        return $this->offlineLocations->sync($samples, isset($context['worker_public_id']) ? (string)$context['worker_public_id'] : null, isset($context['device_id']) ? (string)$context['device_id'] : null);
    }

    public function workOrderCostEvidence(string $companyId, string $workOrderPublicId, array $context = []): array
    {
        $this->assertCompany($companyId);
        $this->permissions->authorize($this->context->userId(), $companyId, 'titan-maps-intelligence.route.read', ['peer'=>'titan-field','purpose'=>'work-order-cost-evidence']);
        $reference=$this->references->resolve($companyId,'job',$workOrderPublicId);
        if($reference===null) throw new InvalidArgumentException('Titan Field work order reference was not found for spatial evidence.');

        $route=null;
        if(Schema::hasTable('maps_route_snapshots') && Schema::hasColumn('maps_route_snapshots','destination_reference_type')) {
            $route=RouteSnapshot::query()->forCompany($companyId)->where(static function($q) use($workOrderPublicId):void{
                $q->where(static fn($inner)=>$inner->where('destination_reference_type','job')->where('destination_public_reference_id',$workOrderPublicId))
                  ->orWhere(static fn($inner)=>$inner->where('origin_reference_type','job')->where('origin_public_reference_id',$workOrderPublicId));
            })->with('eta')->latest('calculated_at')->first();
        }
        $territory=null;
        if(Schema::hasTable('maps_territory_evaluations')) {
            $territory=TerritoryEvaluation::query()->forCompany($companyId)->where('target_reference_type','job')->where('target_public_reference_id',$workOrderPublicId)->with('signals')->latest('evaluated_at')->first();
        }
        $eta=$route?->eta;
        $road=$route?->road_distance_metres ?? $territory?->road_distance_metres;
        $straight=$route?->straight_line_distance_metres ?? $territory?->straight_line_distance_metres;
        $duration=$eta?->duration_seconds ?? $territory?->duration_seconds;
        $pricingSignals=[];
        if($territory){foreach($territory->signals as $signal){$pricingSignals[]=[
            'signal_type'=>(string)$signal->signal_type,'severity'=>(string)$signal->severity,'authoritative'=>(bool)$signal->authoritative,
            'application_status'=>(string)$signal->application_status,'hint_type'=>$signal->hint_type,'hint_value'=>$signal->hint_value,'currency'=>$signal->currency,
            'evidence'=>(array)($signal->evidence??[]),
        ];}}
        return [
            'provider'=>'titan-maps-intelligence','basis'=>$route?->result_basis ?? $territory?->result_basis ?? 'no_spatial_evidence',
            'authoritative'=>false,'financial_authority'=>false,'work_order_public_id'=>$workOrderPublicId,
            'route_snapshot_id'=>$route?->id,'territory_evaluation_id'=>$territory?->id,
            'road_distance_meters'=>$road!==null?(int)$road:null,'straight_line_distance_meters'=>$straight!==null?(int)$straight:null,
            'duration_seconds'=>$duration!==null?(int)$duration:null,'traffic_delay_seconds'=>$eta?->traffic_delay_seconds!==null?(int)$eta->traffic_delay_seconds:null,
            'distance_basis'=>$territory?->distance_basis ?? $route?->result_basis,'eta_basis'=>$territory?->eta_basis ?? $eta?->traffic_basis,
            'covered'=>$territory?->covered,'pricing_signals'=>$pricingSignals,
            'freshness'=>$route&&$route->stale_at&&$route->stale_at->isPast()?'stale':($route?'snapshot':'unknown'),
            'calculated_at'=>$route?->calculated_at?->toAtomString() ?? $territory?->evaluated_at?->toAtomString(),
        ];
    }

    /**
     * Read-only spatial pressure evidence for Titan Field capacity forecasting.
     * Demand points are supplied by Field; Maps contributes travel-matrix, territory and freshness facts only.
     * @return array<string,mixed>
     */
    public function capacityPressureEvidence(string $companyId, array $context = []): array
    {
        $this->assertCompany($companyId);
        $this->permissions->authorize($this->context->userId(), $companyId, 'titan-maps-intelligence.route.calculate', ['peer'=>'titan-field','purpose'=>'capacity-pressure']);
        $points=array_slice(array_values((array)($context['demand_points']??[])),0,20);
        $durations=[];$distances=[];$uncovered=0;$evaluated=0;$freshness=['fresh'=>0,'stale'=>0,'estimate'=>0,'none'=>0];$territory=['covered'=>0,'uncovered'=>0,'unknown'=>0];$details=[];
        foreach($points as $point){
            if(!is_array($point)||!isset($point['latitude'],$point['longitude'])||!is_numeric($point['latitude'])||!is_numeric($point['longitude']))continue;
            $lat=(float)$point['latitude'];$lng=(float)$point['longitude'];if($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180)continue;$evaluated++;
            $nearest=null;$basis='none';$fresh='none';
            try{
                $result=$this->nearestResources->find(new Coordinates($lat,$lng),'worker',3,(string)($context['travel_mode']??'DRIVE'),(string)($context['routing_preference']??'TRAFFIC_AWARE'));
                $basis=(string)($result['basis']??'none');$fresh=(string)($result['freshness_status']??($result['resources']===[]?'none':'estimate'));$resources=(array)($result['resources']??[]);$nearest=$resources[0]??null;
            }catch(\Throwable $e){$basis='unavailable';$fresh='none';$nearest=null;}
            if(!isset($freshness[$fresh]))$fresh='estimate';$freshness[$fresh]++;
            $duration=is_array($nearest)&&isset($nearest['duration_seconds'])&&is_numeric($nearest['duration_seconds'])?(int)$nearest['duration_seconds']:null;
            $distance=is_array($nearest)&&isset($nearest['distance_metres'])&&is_numeric($nearest['distance_metres'])?(int)$nearest['distance_metres']:(is_array($nearest)&&isset($nearest['straight_line_distance_metres'])&&is_numeric($nearest['straight_line_distance_metres'])?(int)$nearest['straight_line_distance_metres']:null);
            if($nearest===null){$uncovered++;}else{if($duration!==null)$durations[]=$duration;if($distance!==null)$distances[]=$distance;}
            $territoryState='unknown';$ref=(string)($point['public_reference_id']??'');
            if($ref!=='' && Schema::hasTable('maps_territory_evaluations')){
                $evaluation=TerritoryEvaluation::query()->forCompany($companyId)->where('target_public_reference_id',$ref)->latest('evaluated_at')->first();
                if($evaluation!==null){$territoryState=$evaluation->covered===true?'covered':($evaluation->covered===false?'uncovered':'unknown');}
            }
            $territory[$territoryState]++;
            $details[]=['public_reference_id'=>$ref?:null,'basis'=>$basis,'freshness'=>$fresh,'nearest_worker_public_id'=>is_array($nearest)?($nearest['public_reference_id']??null):null,'nearest_worker_duration_seconds'=>$duration,'nearest_worker_distance_meters'=>$distance,'territory'=>$territoryState];
        }
        $avgDuration=$durations===[]?null:(int)round(array_sum($durations)/count($durations));$avgDistance=$distances===[]?null:(int)round(array_sum($distances)/count($distances));
        return [
            'provider'=>'titan-maps-intelligence','basis'=>'nearest_worker_travel_matrix_and_existing_territory_evidence','authoritative'=>false,'operational_authority'=>false,'financial_authority'=>false,
            'demand_points_received'=>count($points),'demand_points_evaluated'=>$evaluated,'uncovered_demand_count'=>$uncovered,
            'nearest_worker_duration_seconds'=>$avgDuration,'nearest_worker_distance_meters'=>$avgDistance,
            'capacity_adjustment_seconds'=>$durations===[]?null:array_sum($durations),'capacity_adjustment_basis'=>'sum_of_nearest_worker_one_way_travel_proxy_not_route_commitment',
            'freshness'=>$freshness,'territory'=>$territory,'details'=>$details,'mutation'=>'none',
        ];
    }

    public function mapPayload(string $companyId, string $page = 'field.team'): array
    {
        $this->assertCompany($companyId);
        $this->permissions->authorize($this->context->userId(), $companyId, 'titan-maps-intelligence.worker-location.read', ['peer'=>'titan-field']);
        $payload = $this->mapViews->forPage($companyId, $page) ?? ['markers'=>[],'polylines'=>[],'polygons'=>[],'circles'=>[]];
        if ($page === 'field.team' && Route::has('dashboard.user.titan-maps-intelligence.field.team.data')) {
            $payload['live'] = [
                'endpoint' => route('dashboard.user.titan-maps-intelligence.field.team.data'),
                'interval_ms' => $this->configuration->teamMapRefreshSeconds() * 1000,
            ];
        }
        return $payload;
    }

    public function mapUi(): array { return $this->configuration->mapUi(); }


    public function routeOptimizationProposal(string $companyId, string $fieldRoutePublicId, array $route, array $stops, array $context = []): array
    {
        $this->assertCompany($companyId);
        $this->permissions->authorize($this->context->userId(), $companyId, 'titan-maps-intelligence.route.calculate', ['peer'=>'titan-field','purpose'=>'field-route-optimisation-proposal']);
        return $this->routeOptimisationProposals->propose($fieldRoutePublicId,$route,$stops,$context);
    }

    private function assertCompany(string $companyId): void
    {
        if (trim($companyId)==='' || !hash_equals($this->context->companyId(), trim($companyId))) throw new InvalidArgumentException('Titan Maps peer tenant context mismatch.');
    }
}
