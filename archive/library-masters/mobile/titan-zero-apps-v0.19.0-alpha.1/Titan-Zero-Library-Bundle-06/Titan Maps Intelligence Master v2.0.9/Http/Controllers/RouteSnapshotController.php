<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Controllers;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\RouteRequest;
use App\Extensions\TitanMapsIntelligence\Models\RouteSnapshot;
use App\Extensions\TitanMapsIntelligence\Services\MapsConfiguration;
use App\Extensions\TitanMapsIntelligence\Services\RouteCalculationService;
use App\Extensions\TitanMapsIntelligence\Services\RouteResultPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class RouteSnapshotController
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly RouteCalculationService $routes,
        private readonly RouteResultPresenter $presenter,
        private readonly MapsConfiguration $configuration,
    ) {}

    public function calculate(Request $request): JsonResponse
    {
        [$routeRequest, $origin, $destination] = $this->validatedRequest($request);
        $result = $this->routes->calculate($routeRequest);
        return response()->json(['data' => $this->presenter->present($result, $origin, $destination)]);
    }

    public function index(Request $request): JsonResponse
    {
        $limit = min(max((int) $request->integer('limit', 20), 1), $this->configuration->routeHistoryLimit());
        $filters = $request->validate([
            'worker_public_id'=>['nullable','string','max:191'],
            'customer_public_id'=>['nullable','string','max:191'],
            'date_from'=>['nullable','date'],
            'date_to'=>['nullable','date'],
        ]);
        $query = RouteSnapshot::query()->forCompany($this->context->companyId())->with('eta');
        if (!empty($filters['worker_public_id'])) $query->where('worker_public_id',(string)$filters['worker_public_id']);
        if (!empty($filters['customer_public_id'])) $query->where('customer_public_id',(string)$filters['customer_public_id']);
        if (!empty($filters['date_from'])) $query->where('calculated_at','>=',$filters['date_from']);
        if (!empty($filters['date_to'])) $query->where('calculated_at','<=',$filters['date_to']);
        $rows = $query->latest('created_at')->limit($limit)->get()
            ->map(fn (RouteSnapshot $route): array => $this->presenter->snapshot($route))->values()->all();
        return response()->json(['data' => $rows]);
    }

    public function show(RouteSnapshot $mapsRouteSnapshot): JsonResponse
    {
        return response()->json(['data' => $this->presenter->snapshot($mapsRouteSnapshot)]);
    }

    /** @return array{0:RouteRequest,1:Coordinates,2:Coordinates} */
    private function validatedRequest(Request $request): array
    {
        $data = $request->validate([
            'origin_latitude' => ['required', 'numeric', 'between:-90,90'],
            'origin_longitude' => ['required', 'numeric', 'between:-180,180'],
            'destination_latitude' => ['required', 'numeric', 'between:-90,90'],
            'destination_longitude' => ['required', 'numeric', 'between:-180,180'],
            'travel_mode' => ['nullable', 'in:DRIVE,WALK,BICYCLE,TWO_WHEELER,TRANSIT'],
            'routing_preference' => ['nullable', 'in:TRAFFIC_UNAWARE,TRAFFIC_AWARE,TRAFFIC_AWARE_OPTIMAL'],
            'departure_time' => ['nullable', 'date'],
            'worker_public_id'=>['nullable','string','max:191'],
            'customer_public_id'=>['nullable','string','max:191'],
            'origin_reference_type'=>['nullable','string','max:64'],
            'origin_public_reference_id'=>['nullable','string','max:191'],
            'destination_reference_type'=>['nullable','string','max:64'],
            'destination_public_reference_id'=>['nullable','string','max:191'],
        ]);
        $origin = new Coordinates((float) $data['origin_latitude'], (float) $data['origin_longitude']);
        $destination = new Coordinates((float) $data['destination_latitude'], (float) $data['destination_longitude']);
        return [new RouteRequest(
            origin: $origin,
            destination: $destination,
            travelMode: (string) ($data['travel_mode'] ?? 'DRIVE'),
            routingPreference: (string) ($data['routing_preference'] ?? 'TRAFFIC_AWARE'),
            departureTime: isset($data['departure_time']) ? (string) $data['departure_time'] : null,
            workerPublicId:$data['worker_public_id']??null, customerPublicId:$data['customer_public_id']??null,
            originReferenceType:$data['origin_reference_type']??null, originPublicReferenceId:$data['origin_public_reference_id']??null,
            destinationReferenceType:$data['destination_reference_type']??null, destinationPublicReferenceId:$data['destination_public_reference_id']??null,
        ), $origin, $destination];
    }
}
