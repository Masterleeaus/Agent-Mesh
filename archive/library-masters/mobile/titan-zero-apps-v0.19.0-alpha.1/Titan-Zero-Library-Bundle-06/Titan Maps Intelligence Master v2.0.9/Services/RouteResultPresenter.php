<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\RouteCalculationResult;
use App\Extensions\TitanMapsIntelligence\Models\RouteSnapshot;

final class RouteResultPresenter
{
    public function __construct(private readonly EncodedPolylineDecoder $decoder) {}

    /** @return array<string,mixed> */
    public function present(RouteCalculationResult $result, Coordinates $origin, Coordinates $destination): array
    {
        $points = $this->decoder->decode($result->encodedPolyline);
        if (count($points) < 2) {
            $points = [
                ['lat' => $origin->latitude, 'lng' => $origin->longitude],
                ['lat' => $destination->latitude, 'lng' => $destination->longitude],
            ];
        }

        return [
            'result_basis' => $result->basis,
            'provider' => $result->provider,
            'distance_basis' => $result->distanceBasis(),
            'road_distance_metres' => $result->roadDistanceMetres,
            'distance_metres' => $result->roadDistanceMetres,
            'straight_line_distance_metres' => $result->straightLineDistanceMetres,
            'eta_basis' => $result->etaBasis(),
            'duration_seconds' => $result->durationSeconds,
            'static_duration_seconds' => $result->staticDurationSeconds,
            'traffic_delay_seconds' => $result->trafficDelaySeconds,
            'traffic_basis' => $result->trafficBasis,
            'freshness_status' => $result->freshnessStatus(),
            'calculated_at' => $result->calculatedAt->format(DATE_ATOM),
            'stale_at' => $result->staleAt?->format(DATE_ATOM),
            'valid_until' => $result->validUntil?->format(DATE_ATOM),
            'route_snapshot_id' => $result->routeSnapshotId,
            'eta_snapshot_id' => $result->etaSnapshotId,
            'source_snapshot_id' => $result->sourceSnapshotId,
            'provider_error_code' => $result->providerErrorCode,
            'encoded_polyline' => $result->encodedPolyline,
            'geometry_basis' => $result->encodedPolyline !== null ? 'provider_route' : 'straight_line_estimate',
            'points' => $points,
            'origin' => ['lat' => $origin->latitude, 'lng' => $origin->longitude],
            'destination' => ['lat' => $destination->latitude, 'lng' => $destination->longitude],
        ];
    }

    /** @return array<string,mixed> */
    public function snapshot(RouteSnapshot $route): array
    {
        $route->loadMissing('eta');
        $eta = $route->eta;
        return [
            'id' => (string) $route->id,
            'result_basis' => (string) $route->result_basis,
            'provider' => $route->provider,
            'distance_basis' => $route->road_distance_metres === null ? 'straight_line_estimate' : 'road_distance',
            'road_distance_metres' => $route->road_distance_metres === null ? null : (int) $route->road_distance_metres,
            'distance_metres' => $route->road_distance_metres === null ? null : (int) $route->road_distance_metres,
            'straight_line_distance_metres' => (int) $route->straight_line_distance_metres,
            'duration_seconds' => $eta?->duration_seconds === null ? null : (int) $eta->duration_seconds,
            'static_duration_seconds' => $eta?->static_duration_seconds === null ? null : (int) $eta->static_duration_seconds,
            'traffic_delay_seconds' => $eta?->traffic_delay_seconds === null ? null : (int) $eta->traffic_delay_seconds,
            'traffic_basis' => $eta?->traffic_basis ?? 'unavailable',
            'eta_basis' => match ((string) $route->result_basis) {
                'provider_route' => $eta?->duration_seconds === null ? 'unavailable' : 'provider_eta',
                'last_valid_snapshot' => $eta?->duration_seconds === null ? 'unavailable' : 'stale_snapshot',
                default => 'unavailable',
            },
            'freshness_status' => match ((string) $route->result_basis) {
                'provider_route' => ($route->stale_at !== null && $route->stale_at->isPast()) ? 'stale' : 'fresh',
                'last_valid_snapshot' => 'stale',
                default => 'estimate',
            },
            'origin' => ['lat' => (float) $route->origin_latitude, 'lng' => (float) $route->origin_longitude],
            'destination' => ['lat' => (float) $route->destination_latitude, 'lng' => (float) $route->destination_longitude],
            'travel_mode' => (string) $route->travel_mode,
            'routing_preference' => (string) $route->routing_preference,
            'calculated_at' => $route->calculated_at?->toAtomString(),
            'served_at' => $route->created_at?->toAtomString(),
            'stale_at' => $route->stale_at?->toAtomString(),
            'valid_until' => $eta?->valid_until?->toAtomString(),
            'worker_public_id'=>$route->worker_public_id,'customer_public_id'=>$route->customer_public_id,
            'source_snapshot_id' => $route->source_snapshot_id,
            'provider_error_code' => $route->provider_error_code,
            'encoded_polyline' => $route->encoded_polyline,
        ];
    }
}
