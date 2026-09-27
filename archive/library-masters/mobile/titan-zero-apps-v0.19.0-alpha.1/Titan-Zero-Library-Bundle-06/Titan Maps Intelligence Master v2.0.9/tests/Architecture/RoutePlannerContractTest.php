<?php

declare(strict_types=1);

namespace Tests\Architecture\Extensions\TitanMapsIntelligence;

use PHPUnit\Framework\TestCase;

final class RoutePlannerContractTest extends TestCase
{
    private string $root;
    protected function setUp(): void { parent::setUp(); $this->root=dirname(__DIR__,2); }

    public function test_route_plan_domain_and_routes_are_packaged(): void
    {
        foreach(['Models/RoutePlan.php','Models/RoutePlanStop.php','Models/RoutePlanRun.php','Services/RoutePlanOptimiser.php','Services/RoutePlanService.php','Http/Controllers/RoutePlanController.php'] as $file) self::assertFileExists($this->root.'/'.$file);
        $routes=(string)file_get_contents($this->root.'/routes/api.php');
        self::assertStringContainsString("/route-plans",$routes);
        self::assertStringContainsString('titan-maps-intelligence.route-plan.manage',$routes);
        self::assertStringContainsString('titan-maps-intelligence.route-plan.read',$routes);
    }

    public function test_honesty_and_constraint_contract_is_explicit(): void
    {
        $service=(string)file_get_contents($this->root.'/Services/RoutePlanService.php');
        $optimiser=(string)file_get_contents($this->root.'/Services/RoutePlanOptimiser.php');
        self::assertStringContainsString("$snapshot->result_basis !== 'straight_line_estimate'",$service);
        self::assertStringContainsString("'sequence_connectors'",$service);
        self::assertStringContainsString('$stop->locked',$optimiser);
        self::assertStringContainsString('windowViolations',$optimiser);
    }
}
