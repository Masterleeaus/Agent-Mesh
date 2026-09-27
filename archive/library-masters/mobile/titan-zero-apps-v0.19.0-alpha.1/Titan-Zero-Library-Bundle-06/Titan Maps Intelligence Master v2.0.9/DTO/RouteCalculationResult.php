<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use DateTimeImmutable;

final readonly class RouteCalculationResult
{
    private const BASES = ['provider_route', 'last_valid_snapshot', 'straight_line_estimate'];
    private const TRAFFIC_BASES = ['traffic_aware', 'traffic_unaware', 'stale_snapshot', 'unavailable'];

    public function __construct(
        public string $basis,
        public ?string $provider,
        public ?int $roadDistanceMetres,
        public int $straightLineDistanceMetres,
        public ?int $durationSeconds,
        public ?int $staticDurationSeconds,
        public ?int $trafficDelaySeconds,
        public string $trafficBasis,
        public ?string $encodedPolyline,
        public DateTimeImmutable $calculatedAt,
        public ?DateTimeImmutable $staleAt,
        public ?string $routeSnapshotId,
        public ?string $etaSnapshotId,
        public ?string $sourceSnapshotId,
        public ?string $providerErrorCode = null,
        public ?DateTimeImmutable $validUntil = null,
    ) {
        if (! in_array($basis, self::BASES, true)) {
            throw MapsIntelligenceException::fromCode('MAPS_ROUTE_RESULT_INVALID', 'Unsupported route result basis.', ['basis' => $basis]);
        }
        if (! in_array($trafficBasis, self::TRAFFIC_BASES, true)) {
            throw MapsIntelligenceException::fromCode('MAPS_ROUTE_RESULT_INVALID', 'Unsupported traffic basis.', ['traffic_basis' => $trafficBasis]);
        }
        if ($straightLineDistanceMetres < 0 || ($roadDistanceMetres !== null && $roadDistanceMetres < 0)) {
            throw MapsIntelligenceException::fromCode('MAPS_ROUTE_RESULT_INVALID', 'Route distance values cannot be negative.');
        }
        if ($basis === 'straight_line_estimate' && ($roadDistanceMetres !== null || $durationSeconds !== null || $staticDurationSeconds !== null || $trafficDelaySeconds !== null)) {
            throw MapsIntelligenceException::fromCode('MAPS_ROUTE_RESULT_INVALID', 'Straight-line fallback cannot claim road distance or ETA.');
        }
        if ($basis !== 'straight_line_estimate' && $roadDistanceMetres === null) {
            throw MapsIntelligenceException::fromCode('MAPS_ROUTE_RESULT_INVALID', 'Provider-derived and snapshot routes require road distance.');
        }
    }

    public function distanceBasis(): string
    {
        return $this->roadDistanceMetres === null ? 'straight_line_estimate' : 'road_distance';
    }

    public function etaBasis(): string
    {
        return match ($this->basis) {
            'provider_route' => $this->durationSeconds === null ? 'unavailable' : 'provider_eta',
            'last_valid_snapshot' => $this->durationSeconds === null ? 'unavailable' : 'stale_snapshot',
            default => 'unavailable',
        };
    }

    public function freshnessStatus(): string
    {
        return match ($this->basis) {
            'provider_route' => 'fresh',
            'last_valid_snapshot' => 'stale',
            default => 'estimate',
        };
    }
}
