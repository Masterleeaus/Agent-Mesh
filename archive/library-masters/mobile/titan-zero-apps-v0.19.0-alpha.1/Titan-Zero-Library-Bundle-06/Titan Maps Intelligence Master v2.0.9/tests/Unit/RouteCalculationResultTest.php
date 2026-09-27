<?php

declare(strict_types=1);

namespace Tests\Unit\Extensions\TitanMapsIntelligence;

use App\Extensions\TitanMapsIntelligence\DTO\RouteCalculationResult;
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

final class RouteCalculationResultTest extends TestCase
{
    public function test_straight_line_estimate_cannot_claim_road_distance_or_eta(): void
    {
        $result = new RouteCalculationResult(
            basis: 'straight_line_estimate',
            provider: null,
            roadDistanceMetres: null,
            straightLineDistanceMetres: 4210,
            durationSeconds: null,
            staticDurationSeconds: null,
            trafficDelaySeconds: null,
            trafficBasis: 'unavailable',
            encodedPolyline: null,
            calculatedAt: new DateTimeImmutable('2026-08-10T00:00:00+00:00'),
            staleAt: null,
            routeSnapshotId: null,
            etaSnapshotId: null,
            sourceSnapshotId: null,
            providerErrorCode: 'MAPS_PROVIDER_UNAVAILABLE',
        );

        self::assertSame('straight_line_estimate', $result->distanceBasis());
        self::assertNull($result->roadDistanceMetres);
        self::assertNull($result->durationSeconds);
        self::assertSame('estimate', $result->freshnessStatus());
    }
}
