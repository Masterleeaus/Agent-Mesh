<?php

declare(strict_types=1);

namespace Tests\Unit\Extensions\TitanMapsIntelligence;

use App\Extensions\TitanMapsIntelligence\DTO\WorkerLocationPing;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

final class WorkerLocationPingTest extends TestCase
{
    public function test_impossible_coordinates_are_rejected(): void
    {
        $this->expectException(MapsIntelligenceException::class);
        new WorkerLocationPing(95.0, 144.0, 10.0, new DateTimeImmutable('now'));
    }

    public function test_invalid_motion_is_rejected(): void
    {
        $this->expectException(MapsIntelligenceException::class);
        new WorkerLocationPing(-37.81, 144.96, 10.0, new DateTimeImmutable('now'), speedMetresPerSecond: 200.0);
    }
}
