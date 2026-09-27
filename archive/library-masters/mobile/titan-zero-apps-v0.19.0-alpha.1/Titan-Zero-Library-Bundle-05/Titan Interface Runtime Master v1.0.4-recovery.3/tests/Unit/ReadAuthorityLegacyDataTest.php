<?php

declare(strict_types=1);

namespace Tests\Unit\Extensions\TitanInterfaceRuntime;

use App\Extensions\TitanInterfaceRuntime\System\Authority\AuthorityReadResult;
use App\Extensions\TitanInterfaceRuntime\System\Authority\AuthorizedViewReader;
use App\Extensions\TitanInterfaceRuntime\System\Authority\InMemoryReadCache;
use App\Extensions\TitanInterfaceRuntime\System\Authority\ReadAuthorityRouter;
use App\Extensions\TitanInterfaceRuntime\System\Authority\ReadQuery;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority\ReadAuthorityAdapterContract;
use App\Extensions\TitanInterfaceRuntime\System\Data\ArrayLegacyRouteLocator;
use App\Extensions\TitanInterfaceRuntime\System\Data\DataModeProjector;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryLegacyDataSurfaceRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryViewRegistry;
use PHPUnit\Framework\TestCase;

final class ReadAuthorityLegacyDataTest extends TestCase
{
    public function test_read_provenance_and_request_cache_are_tenant_scoped(): void
    {
        $views=new InMemoryViewRegistry();
        $views->rebuild(['crm'=>['views'=>[$this->view()]]]);
        $adapter=new class implements ReadAuthorityAdapterContract {
            public int $calls=0;
            public function supports(string $authority,string $mode):bool{return $mode==='read-model';}
            public function read(InterfaceContext $context,string $authority,string $reference,array $criteria=[]):AuthorityReadResult{
                $this->calls++;
                return new AuthorityReadResult($authority,$reference,[['company_id'=>$context->companyId]],['source'=>'test']);
            }
        };
        $reader=new AuthorizedViewReader($views,new ReadAuthorityRouter([$adapter],new InMemoryReadCache()));
        $a=new InterfaceContext(7,11,'command','customers',capabilities:['crm.customer.view'],traceId:'trace-a',correlationId:'corr-a');
        $b=new InterfaceContext(8,11,'command','customers',capabilities:['crm.customer.view'],traceId:'trace-b',correlationId:'corr-b');
        $query=new ReadQuery(filters:['status'=>'active'],perPage:25);
        $first=$reader->read('crm.customers.table',$a,$query);
        $again=$reader->read('crm.customers.table',$a,$query);
        $otherTenant=$reader->read('crm.customers.table',$b,$query);
        self::assertSame(7,$first->provenance['company_id']);
        self::assertSame('request-hit',$again->provenance['cache']);
        self::assertSame(8,$otherTenant->provenance['company_id']);
        self::assertSame(2,$adapter->calls);
    }

    public function test_legacy_data_mode_is_deep_link_only_and_hidden_from_hub(): void
    {
        $registry=new InMemoryLegacyDataSurfaceRegistry();
        $registry->rebuild(['crm'=>['legacy_data_surfaces'=>[[$this->legacySurface()]]]]);
        $projector=new DataModeProjector($registry,new ArrayLegacyRouteLocator(['dashboard.user.crm.customers.index'=>'/dashboard/user/crm/customers']));
        $command=new InterfaceContext(7,11,'command','customers',capabilities:['crm.customer.view']);
        self::assertSame('deep-link',$projector->forObject('crm.customer',$command)->surfaces[0]->embedPolicy);
        $hub=new InterfaceContext(7,11,'hub','customers',capabilities:['crm.customer.view']);
        self::assertSame([],$projector->forObject('crm.customer',$hub)->surfaces);
    }

    private function view(): array
    {
        return ['key'=>'crm.customers.table','label'=>'Customers','kind'=>'table','applies_to'=>['crm.customer'],'product_surfaces'=>['command'],'customer_safe'=>false,'permissions'=>['crm.customer.view'],'data_source'=>['authority'=>'titan-crm','mode'=>'read-model','reference'=>'crm.customers.index'],'component_hint'=>'table'];
    }
    private function legacySurface(): array
    {
        return ['key'=>'crm.customers.legacy','route_name'=>'dashboard.user.crm.customers.index','object_refs'=>['crm.customer'],'permissions'=>['crm.customer.view']];
    }
}
