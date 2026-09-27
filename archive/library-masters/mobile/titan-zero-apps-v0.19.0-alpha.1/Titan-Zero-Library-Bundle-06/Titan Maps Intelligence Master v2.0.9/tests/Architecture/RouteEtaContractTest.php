<?php

declare(strict_types=1);

namespace Tests\Architecture\Extensions\TitanMapsIntelligence;

use PHPUnit\Framework\TestCase;

final class RouteEtaContractTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        parent::setUp();
        $this->root = dirname(__DIR__, 2);
    }

    public function test_route_and_eta_snapshot_models_and_migrations_exist(): void
    {
        foreach ([
            'Models/RouteSnapshot.php',
            'Models/EtaSnapshot.php',
            'database/migrations/2026_08_10_001000_create_maps_route_snapshots_table.php',
            'database/migrations/2026_08_10_001100_create_maps_eta_snapshots_table.php',
        ] as $path) {
            self::assertFileExists($this->root.'/'.$path, $path);
        }
    }

    public function test_durable_route_service_has_explicit_fallback_order(): void
    {
        $source = (string) file_get_contents($this->root.'/Services/RouteCalculationService.php');
        self::assertStringContainsString('provider_route', $source);
        self::assertStringContainsString('last_valid_snapshot', $source);
        self::assertStringContainsString('straight_line_estimate', $source);
        self::assertStringContainsString('road_distance_metres', $source);
        self::assertStringContainsString('straight_line_distance_metres', $source);
    }

    public function test_routes_are_permission_gated_and_company_bound(): void
    {
        $api = (string) file_get_contents($this->root.'/routes/api.php');
        self::assertStringContainsString('titan-maps-intelligence.route.calculate', $api);
        self::assertStringContainsString('titan-maps-intelligence.route.read', $api);

        $binder = (string) file_get_contents($this->root.'/Http/Middleware/ResolveCompanyScopedRouteBindings.php');
        self::assertStringContainsString("'mapsRouteSnapshot' => RouteSnapshot::class", $binder);
    }
}
