<?php

declare(strict_types=1);

namespace Tests\Unit\Conformance;

use PHPUnit\Framework\TestCase;

final class TitanMapsIntelligenceConformanceTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        parent::setUp();
        $this->root = dirname(__DIR__, 3);
    }

    public function test_canonical_provider_and_legacy_alias_are_both_packaged(): void
    {
        self::assertFileExists($this->root.'/System/TitanMapsIntelligenceServiceProvider.php');
        self::assertFileExists($this->root.'/TitanMapsIntelligenceServiceProvider.php');
    }

    public function test_all_pass_three_route_profiles_are_packaged(): void
    {
        foreach (['user.php', 'admin.php', 'api.php', 'internal.php'] as $routeFile) {
            self::assertFileExists($this->root.'/routes/'.$routeFile);
        }
    }

    public function test_existing_discovery_capabilities_remain_declared(): void
    {
        $manifest = json_decode(
            (string) file_get_contents($this->root.'/extension.manifest.json'),
            true,
            flags: JSON_THROW_ON_ERROR,
        );

        self::assertContains('titan-maps-intelligence.search.businesses', $manifest['capabilities']);
        self::assertContains('titan-maps-intelligence.candidate.promote', $manifest['capabilities']);
        self::assertContains('titan-maps-intelligence.territory.analyse', $manifest['capabilities']);
        self::assertContains('titan-maps-intelligence.route.calculate', $manifest['capabilities']);
        self::assertContains('titan-maps-intelligence.route.history', $manifest['capabilities']);
        self::assertContains('titan-maps-intelligence.travel-matrix.calculate', $manifest['capabilities']);
        self::assertContains('titan-maps-intelligence.nearest-resource.find', $manifest['capabilities']);
        self::assertContains('titan-maps-intelligence.route-plan.manage', $manifest['capabilities']);
        self::assertContains('titan-maps-intelligence.route-plan.read', $manifest['capabilities']);
        self::assertContains('titan-maps-intelligence.dispatch.recommend', $manifest['capabilities']);
        self::assertContains('titan-maps-intelligence.dispatch.read', $manifest['capabilities']);
        self::assertContains('titan-maps-intelligence.dispatch.decide', $manifest['capabilities']);
    }
}
