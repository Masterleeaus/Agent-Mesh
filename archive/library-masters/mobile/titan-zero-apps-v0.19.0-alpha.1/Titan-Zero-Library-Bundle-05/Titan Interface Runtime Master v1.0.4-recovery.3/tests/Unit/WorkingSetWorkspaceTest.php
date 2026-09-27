<?php

declare(strict_types=1);

namespace Tests\Unit\Extensions\TitanInterfaceRuntime;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\WorkingSet\WorkingSetDomainItemVerifierContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\WorkingSet\WorkingSetGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ArrayComponentVocabulary;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationComponentPolicy;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryObjectRegistry;
use App\Extensions\TitanInterfaceRuntime\System\WorkingSet\WorkingSetSourceItem;
use App\Extensions\TitanInterfaceRuntime\System\WorkingSet\WorkingSetSourceResult;
use App\Extensions\TitanInterfaceRuntime\System\WorkingSet\WorkingSetWorkspaceComposer;
use PHPUnit\Framework\TestCase;

final class WorkingSetWorkspaceTest extends TestCase
{
    public function test_membership_does_not_grant_object_authorization(): void
    {
        $objects=new InMemoryObjectRegistry();
        $objects->rebuild(['crm'=>['schema_version'=>'1.1','objects'=>[
            ['key'=>'crm.customer','label'=>'Customer','data_authority'=>'crm','scope'=>['type'=>'tenant','tenant_key'=>'company_id'],'product_surfaces'=>['command'],'customer_safe'=>false,'permissions'=>['crm.customer.view'],'facet_refs'=>[],'view_refs'=>[],'action_refs'=>[],'relationship_refs'=>[],'offline_mode'=>'read-only'],
            ['key'=>'crm.invoice','label'=>'Invoice','data_authority'=>'crm','scope'=>['type'=>'tenant','tenant_key'=>'company_id'],'product_surfaces'=>['command'],'customer_safe'=>false,'permissions'=>['crm.invoice.view'],'facet_refs'=>[],'view_refs'=>[],'action_refs'=>[],'relationship_refs'=>[],'offline_mode'=>'read-only'],
        ],'relationships'=>[]]]);
        $gateway=new class implements WorkingSetGatewayContract{public function inspect(string $workingSetId,InterfaceContext $context):WorkingSetSourceResult{return new WorkingSetSourceResult('titan-workspace-projects','ready',$workingSetId,'11',null,'Contract',null,['business_id'=>'7'],[new WorkingSetSourceItem('1','customer','C1','Sarah'),new WorkingSetSourceItem('2','invoice','I1','Invoice')]);}public function health():array{return['status'=>'healthy'];}};
        $verifier=new class implements WorkingSetDomainItemVerifierContract{public function verify(string $itemType,string $itemId,InterfaceContext $context):bool{return true;}};
        $presentation=new BuilderPresentationAdapter(new ArrayComponentVocabulary(['stack'=>['authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]]]),new PresentationComponentPolicy());
        $composer=new WorkingSetWorkspaceComposer($gateway,$verifier,$objects,$presentation,['customer'=>['crm.customer'],'invoice'=>['crm.invoice']],[],200);
        $result=$composer->open('42',new InterfaceContext(7,11,'command','work',capabilities:['crm.customer.view']));
        self::assertCount(1,$result->items);
        self::assertSame('crm.customer@7:C1',$result->items[0]->objectReference);
        self::assertFalse($result->contextEnvelope['membership_grants_authorization']);
    }
}
