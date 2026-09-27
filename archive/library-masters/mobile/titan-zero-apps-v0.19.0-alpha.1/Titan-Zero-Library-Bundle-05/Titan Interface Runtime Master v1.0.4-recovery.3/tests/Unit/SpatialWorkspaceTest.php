<?php

declare(strict_types=1);

namespace Tests\Unit\Extensions\TitanInterfaceRuntime;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryObjectRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Spatial\SpatialPayloadNormalizer;
use PHPUnit\Framework\TestCase;

final class SpatialWorkspaceTest extends TestCase
{
    public function test_normalizer_drops_invalid_and_cross_tenant_object_pins(): void
    {
        $objects=new InMemoryObjectRegistry();
        $objects->rebuild(['crm'=>['objects'=>[$this->object()],'relationships'=>[]]]);
        $normalizer=new SpatialPayloadNormalizer($objects);
        $context=new InterfaceContext(7,11,'command','customers',capabilities:['crm.customer.view']);
        $result=$normalizer->normalize(['pins'=>[
            ['id'=>'ok','label'=>'OK','lat'=>-37.8,'lng'=>145.0,'object_ref'=>'crm.customer@7:C1'],
            ['id'=>'bad-coord','label'=>'Bad','lat'=>100,'lng'=>145.0,'object_ref'=>'crm.customer@7:C2'],
            ['id'=>'bad-tenant','label'=>'Other','lat'=>-37.8,'lng'=>145.0,'object_ref'=>'crm.customer@8:C3'],
        ]],$context);
        self::assertCount(1,$result['pins']);
        self::assertSame('crm.customer@7:C1',$result['pins'][0]['object_ref']);
        self::assertSame(2,$result['diagnostics']['omitted']['pins']);
    }

    /** @return array<string,mixed> */
    private function object(): array
    {
        return ['key'=>'crm.customer','label'=>'Customer','data_authority'=>'crm','scope'=>['type'=>'tenant','tenant_key'=>'company_id'],'product_surfaces'=>['command'],'customer_safe'=>false,'permissions'=>['crm.customer.view'],'facet_refs'=>[],'view_refs'=>[],'action_refs'=>[],'relationship_refs'=>[],'offline_mode'=>'read-only'];
    }
}
