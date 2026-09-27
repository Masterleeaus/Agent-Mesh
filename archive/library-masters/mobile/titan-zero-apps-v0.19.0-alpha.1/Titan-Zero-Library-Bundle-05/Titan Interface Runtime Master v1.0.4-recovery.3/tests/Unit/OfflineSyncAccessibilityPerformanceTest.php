<?php

declare(strict_types=1);
namespace Tests\Unit;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Performance\{PresentationCache,PresentationPerformanceGuard};
use App\Extensions\TitanInterfaceRuntime\System\Presentation\{AccessibilityAuditor,PresentationNode,PresentationTree,ResponsiveHints};
use PHPUnit\Framework\TestCase;
final class OfflineSyncAccessibilityPerformanceTest extends TestCase
{
    public function test_accessible_mobile_tree_and_cache_are_tenant_scoped():void
    {
        $tree=new PresentationTree('go',new PresentationNode('button','complete',['accessibility'=>['name'=>'Complete job','keyboard_operable'=>true,'focus_visible'=>true,'target_size_px'=>44]]),ResponsiveHints::required());
        self::assertTrue((new AccessibilityAuditor())->audit($tree)->passesWcag22AaTarget());
        self::assertTrue((new PresentationPerformanceGuard())->inspect($tree,[1,2,3])->withinBudget());
        $cache=new PresentationCache(4);$a=new InterfaceContext(1,2,'go','work');$b=new InterfaceContext(2,2,'go','work');$cache->put($a,'en-AU','x',$tree);
        self::assertNotNull($cache->get($a,'en-AU','x'));self::assertNull($cache->get($b,'en-AU','x'));
    }
}
