<?php

declare(strict_types=1);

namespace Tests\Unit\Extensions\TitanMapsIntelligence;

use App\Extensions\TitanMapsIntelligence\Services\LocationFreshnessPolicy;
use App\Extensions\TitanMapsIntelligence\Services\MapsConfiguration;
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

final class LocationFreshnessPolicyTest extends TestCase
{
    public function test_source_specific_ttls_are_deterministic(): void
    {
        $config = require dirname(__DIR__, 2).'/config/titan_maps_intelligence.php';
        $policy = new LocationFreshnessPolicy(new MapsConfiguration($config));
        $now = new DateTimeImmutable('2026-08-10T00:00:00+00:00');

        self::assertFalse($policy->isStale('geocoded', $now->modify('-29 days'), $now));
        self::assertTrue($policy->isStale('geocoded', $now->modify('-30 days'), $now));
        self::assertFalse($policy->isStale('manual', $now->modify('-364 days'), $now));
        self::assertTrue($policy->isStale('manual', $now->modify('-365 days'), $now));
        self::assertFalse($policy->isStale('gps', $now->modify('-9 minutes'), $now));
        self::assertTrue($policy->isStale('gps', $now->modify('-10 minutes'), $now));
    }
}
