<?php

declare(strict_types=1);

namespace Tests\Unit\Extensions\TitanInterfaceRuntime;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\GlobalWork\GlobalWorkProviderGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\GlobalWork\GlobalWorkItemReference;
use App\Extensions\TitanInterfaceRuntime\System\GlobalWork\GlobalWorkProviderHealth;
use App\Extensions\TitanInterfaceRuntime\System\GlobalWork\GlobalWorkProviderResult;
use App\Extensions\TitanInterfaceRuntime\System\GlobalWork\GlobalWorkTrayAggregator;
use App\Extensions\TitanInterfaceRuntime\System\Registry\GlobalWorkDescriptor;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryGlobalWorkRegistry;
use PHPUnit\Framework\TestCase;

final class GlobalWorkTraysTest extends TestCase
{
    public function test_tray_rechecks_tenant_permissions_deduplicates_and_prioritizes(): void
    {
        $registry=new InMemoryGlobalWorkRegistry();
        $registry->rebuild(['crm'=>['global_work'=>[['tray'=>'attention','provider_ref'=>'risk','product_surfaces'=>['command']]]]]);
        $gateway=new class implements GlobalWorkProviderGatewayContract {
            public function fetch(GlobalWorkDescriptor $descriptor,InterfaceContext $context,int $limit):GlobalWorkProviderResult{return new GlobalWorkProviderResult([
                new GlobalWorkItemReference('attention','best','crm','job@7:1','Best',90,20,7,'job@7:1',null,null,['jobs.view']),
                new GlobalWorkItemReference('attention','dupe','crm','job@7:1','Dupe',10,10,7,'job@7:1'),
                new GlobalWorkItemReference('attention','other','crm','job@8:2','Other tenant',100,30,8,'job@8:2'),
            ],new GlobalWorkProviderHealth($descriptor->providerKey(),'healthy',null,3));}
        };
        $context=new InterfaceContext(7,11,'command','work',capabilities:['jobs.view']);
        $tray=(new GlobalWorkTrayAggregator($registry,$gateway))->aggregate($context,'attention');
        self::assertSame('ready',$tray->status);self::assertCount(1,$tray->items);self::assertSame('best',$tray->items[0]->itemKey);self::assertSame(1,$tray->deduplicated);self::assertSame(1,$tray->omitted['tenant']);
    }
}
