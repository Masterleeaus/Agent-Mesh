<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Controllers;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\RouteMatrixRequest;
use App\Extensions\TitanMapsIntelligence\Models\TravelMatrixSnapshot;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Services\MapsConfiguration;
use App\Extensions\TitanMapsIntelligence\Services\NearestResourceService;
use App\Extensions\TitanMapsIntelligence\Services\TravelMatrixService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class TravelMatrixController
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly TravelMatrixService $matrices,
        private readonly NearestResourceService $nearest,
        private readonly MapsConfiguration $configuration,
    ) {}

    public function calculate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'origins'=>['required','array','min:1','max:'.$this->configuration->matrixMaximumOrigins()],
            'origins.*.latitude'=>['required','numeric','between:-90,90'],
            'origins.*.longitude'=>['required','numeric','between:-180,180'],
            'origins.*.reference_type'=>['nullable','string','max:32'],
            'origins.*.public_reference_id'=>['nullable','string','max:191'],
            'origins.*.label'=>['nullable','string','max:191'],
            'destinations'=>['required','array','min:1','max:'.$this->configuration->matrixMaximumDestinations()],
            'destinations.*.latitude'=>['required','numeric','between:-90,90'],
            'destinations.*.longitude'=>['required','numeric','between:-180,180'],
            'destinations.*.reference_type'=>['nullable','string','max:32'],
            'destinations.*.public_reference_id'=>['nullable','string','max:191'],
            'destinations.*.label'=>['nullable','string','max:191'],
            'travel_mode'=>['nullable','in:DRIVE,WALK,BICYCLE,TWO_WHEELER,TRANSIT'],
            'routing_preference'=>['nullable','in:TRAFFIC_UNAWARE,TRAFFIC_AWARE,TRAFFIC_AWARE_OPTIMAL'],
            'departure_time'=>['nullable','date'],
        ]);
        $origins = array_map(static fn(array $p): Coordinates => new Coordinates((float)$p['latitude'],(float)$p['longitude']),$data['origins']);
        $destinations = array_map(static fn(array $p): Coordinates => new Coordinates((float)$p['latitude'],(float)$p['longitude']),$data['destinations']);
        try {
            $result = $this->matrices->calculate(new RouteMatrixRequest(
                $origins,$destinations,(string)($data['travel_mode'] ?? 'DRIVE'),(string)($data['routing_preference'] ?? 'TRAFFIC_AWARE'),isset($data['departure_time']) ? (string)$data['departure_time'] : null,
            ),$data['origins'],$data['destinations']);
        } catch (MapsIntelligenceException $exception) {
            return response()->json(['error'=>$exception->toSafeArray()],422);
        }
        return response()->json(['data'=>$this->present($result['snapshot'],$result['cache_status'])]);
    }

    public function nearest(Request $request): JsonResponse
    {
        $data = $request->validate([
            'origin_latitude'=>['required','numeric','between:-90,90'],
            'origin_longitude'=>['required','numeric','between:-180,180'],
            'resource_type'=>['nullable','in:all,worker,supplier,contractor'],
            'limit'=>['nullable','integer','min:1','max:'.$this->configuration->nearestResourceLimit()],
            'travel_mode'=>['nullable','in:DRIVE,WALK,BICYCLE,TWO_WHEELER,TRANSIT'],
            'routing_preference'=>['nullable','in:TRAFFIC_UNAWARE,TRAFFIC_AWARE,TRAFFIC_AWARE_OPTIMAL'],
        ]);
        try {
            $result = $this->nearest->find(
                new Coordinates((float)$data['origin_latitude'],(float)$data['origin_longitude']),
                (string)($data['resource_type'] ?? 'all'),(int)($data['limit'] ?? 10),
                (string)($data['travel_mode'] ?? 'DRIVE'),(string)($data['routing_preference'] ?? 'TRAFFIC_AWARE'),
            );
        } catch (MapsIntelligenceException $exception) {
            return response()->json(['error'=>$exception->toSafeArray()],422);
        }
        return response()->json(['data'=>$result]);
    }

    public function history(Request $request): JsonResponse
    {
        $limit = min(max((int)$request->integer('limit',20),1),$this->configuration->matrixHistoryLimit());
        $rows = TravelMatrixSnapshot::query()->forCompany($this->context->companyId())->with('elements')->latest('created_at')->limit($limit)->get();
        return response()->json(['data'=>$rows->map(fn(TravelMatrixSnapshot $row): array => $this->present($row,'history'))->values()->all()]);
    }

    private function present(TravelMatrixSnapshot $snapshot, string $cacheStatus): array
    {
        return [
            'id'=>(string)$snapshot->id,'basis'=>(string)$snapshot->result_basis,'provider'=>$snapshot->provider,'cache_status'=>$cacheStatus,
            'freshness_status'=>$snapshot->result_basis === 'provider_matrix'
                ? (($snapshot->stale_at !== null && $snapshot->stale_at->isPast()) ? 'stale' : 'fresh')
                : ($snapshot->result_basis === 'stale_matrix_snapshot' ? 'stale' : 'estimate'),
            'travel_mode'=>$snapshot->travel_mode,'routing_preference'=>$snapshot->routing_preference,
            'origins'=>$snapshot->origins,'destinations'=>$snapshot->destinations,'element_count'=>(int)$snapshot->element_count,
            'provider_error_code'=>$snapshot->provider_error_code,'calculated_at'=>$snapshot->calculated_at?->toAtomString(),'stale_at'=>$snapshot->stale_at?->toAtomString(),
            'elements'=>$snapshot->elements->map(static fn($e): array => [
                'origin_index'=>(int)$e->origin_index,'destination_index'=>(int)$e->destination_index,
                'distance_metres'=>$e->distance_metres === null ? null : (int)$e->distance_metres,'straight_line_distance_metres'=>(int)$e->straight_line_distance_metres,
                'duration_seconds'=>$e->duration_seconds === null ? null : (int)$e->duration_seconds,'static_duration_seconds'=>$e->static_duration_seconds === null ? null : (int)$e->static_duration_seconds,
                'traffic_delay_seconds'=>$e->traffic_delay_seconds === null ? null : (int)$e->traffic_delay_seconds,'condition'=>(string)$e->condition,
                'distance_basis'=>$e->distance_metres === null ? 'straight_line_estimate' : 'road_distance','eta_basis'=>$e->duration_seconds === null ? 'unavailable' : ($snapshot->result_basis === 'stale_matrix_snapshot' ? 'stale_snapshot' : 'provider_eta'),
            ])->values()->all(),
        ];
    }
}
