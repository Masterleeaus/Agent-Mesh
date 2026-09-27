<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Controllers;

use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\RouteRequest;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Services\RouteCalculationService;
use App\Extensions\TitanMapsIntelligence\Services\RouteResultPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class TravelRouteController
{
    public function __construct(
        private readonly RouteCalculationService $routing,
        private readonly RouteResultPresenter $presenter,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'origin_latitude' => ['required', 'numeric', 'between:-90,90'],
            'origin_longitude' => ['required', 'numeric', 'between:-180,180'],
            'destination_latitude' => ['required', 'numeric', 'between:-90,90'],
            'destination_longitude' => ['required', 'numeric', 'between:-180,180'],
            'travel_mode' => ['nullable', 'in:DRIVE,WALK,BICYCLE,TWO_WHEELER,TRANSIT'],
            'routing_preference' => ['nullable', 'in:TRAFFIC_UNAWARE,TRAFFIC_AWARE,TRAFFIC_AWARE_OPTIMAL'],
            'departure_time' => ['nullable', 'date'],
        ]);

        try {
            $origin = new Coordinates((float) $data['origin_latitude'], (float) $data['origin_longitude']);
            $destination = new Coordinates((float) $data['destination_latitude'], (float) $data['destination_longitude']);
            $result = $this->routing->calculate(new RouteRequest(
                origin: $origin,
                destination: $destination,
                travelMode: (string) ($data['travel_mode'] ?? 'DRIVE'),
                routingPreference: (string) ($data['routing_preference'] ?? 'TRAFFIC_AWARE'),
                departureTime: isset($data['departure_time']) ? (string) $data['departure_time'] : null,
            ));
        } catch (MapsIntelligenceException $exception) {
            return response()->json(['error' => $exception->toSafeArray()], 422);
        }

        return response()->json(['data' => $this->presenter->present($result, $origin, $destination)]);
    }
}
