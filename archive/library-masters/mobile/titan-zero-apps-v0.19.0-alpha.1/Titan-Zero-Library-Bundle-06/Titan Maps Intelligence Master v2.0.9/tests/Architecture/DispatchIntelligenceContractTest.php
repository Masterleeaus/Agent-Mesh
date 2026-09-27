<?php

declare(strict_types=1);
namespace Tests\Architecture\Extensions\TitanMapsIntelligence;
use PHPUnit\Framework\TestCase;
final class DispatchIntelligenceContractTest extends TestCase
{
    private string $root;
    protected function setUp(): void { parent::setUp(); $this->root=dirname(__DIR__,2); }
    public function test_dispatch_is_human_approved_and_confirmation_gated_for_ai(): void
    {
        $service=(string)file_get_contents($this->root.'/Services/DispatchIntelligenceService.php');
        $tool=(string)file_get_contents($this->root.'/Tools/DecideDispatchRecommendationTool.php');
        self::assertStringContainsString("status!=='pending_approval'",$service);
        self::assertStringContainsString('MAPS_DISPATCH_CANDIDATE_BLOCKED',$service);
        self::assertStringContainsString('MAPS_DISPATCH_RECOMMENDATION_EXPIRED',$service);
        self::assertStringContainsString('MAPS_CONFIRMATION_REQUIRED',$tool);
        self::assertStringContainsString("'confirmed'",$tool);
    }
    public function test_dispatch_menu_api_and_tenant_binding_are_packaged(): void
    {
        $menu=(string)file_get_contents($this->root.'/System/Navigation/MapsMenuDefinition.php');
        $api=(string)file_get_contents($this->root.'/routes/api.php');
        $binder=(string)file_get_contents($this->root.'/Http/Middleware/ResolveCompanyScopedRouteBindings.php');
        self::assertStringContainsString('Dispatch Intelligence',$menu);
        self::assertStringContainsString('/dispatch/recommendations',$api);
        self::assertStringContainsString("'mapsDispatchRecommendation' => DispatchRecommendation::class",$binder);
    }
}
