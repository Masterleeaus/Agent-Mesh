<?php

declare(strict_types=1);

namespace Tests\Architecture\Extensions\TitanMapsIntelligence;

use PHPUnit\Framework\TestCase;

final class TravelMatrixContractTest extends TestCase
{
    private string $root;
    protected function setUp(): void { parent::setUp(); $this->root = dirname(__DIR__,2); }

    public function test_matrix_models_services_routes_and_tools_are_packaged(): void
    {
        foreach ([
            'Models/TravelMatrixSnapshot.php','Models/TravelMatrixElement.php','Services/TravelMatrixService.php','Services/NearestResourceService.php',
            'Http/Controllers/TravelMatrixController.php','Tools/CalculateTravelMatrixTool.php','Tools/FindNearestResourceTool.php',
        ] as $path) self::assertFileExists($this->root.'/'.$path);
        $api=(string)file_get_contents($this->root.'/routes/api.php');
        self::assertStringContainsString("name('matrices.calculate')",$api);
        self::assertStringContainsString("name('nearest-resources.find')",$api);
    }

    public function test_matrix_fallback_never_claims_eta_for_straight_line_estimates(): void
    {
        $service=(string)file_get_contents($this->root.'/Services/TravelMatrixService.php');
        self::assertStringContainsString("'straight_line_estimate'",$service);
        self::assertStringContainsString("null, null, null, null, 'ESTIMATE_ONLY'",$service);
        self::assertStringContainsString("'stale_matrix_snapshot'",$service);
        self::assertStringContainsString("'fresh_cache'",$service);
    }

    public function test_nearest_worker_candidates_are_on_duty_and_tracking_enabled(): void
    {
        $service=(string)file_get_contents($this->root.'/Services/NearestResourceService.php');
        self::assertStringContainsString("where('tracking_allowed',true)->where('on_duty',true)",$service);
        self::assertStringContainsString("where('source','gps')",$service);
    }
}
