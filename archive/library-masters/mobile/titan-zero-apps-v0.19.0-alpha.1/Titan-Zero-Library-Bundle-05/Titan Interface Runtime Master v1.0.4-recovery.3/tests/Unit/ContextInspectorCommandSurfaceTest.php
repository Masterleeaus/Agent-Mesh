<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Extensions\TitanInterfaceRuntime\System\Command\CommandSurface;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Inspector\ContextInspector;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReference;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ArrayComponentVocabulary;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationComponentPolicy;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryActionRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryDomainRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryFacetRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryObjectRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Workspace\ObjectWorkspaceComposer;
use PHPUnit\Framework\TestCase;

final class ContextInspectorCommandSurfaceTest extends TestCase
{
    public function test_inspector_and_command_surface_preserve_context_and_delegate_actions(): void
    {
        [$domains,$objects,$actions,$inspector,$context]=$this->fixture();
        $snapshot=$inspector->inspect(ObjectReference::parse('crm.customer@7:C1'),$context);
        self::assertSame('crm.customer@7:C1',$snapshot->context->objectRef);
        self::assertSame($context->traceId,$snapshot->context->traceId);
        self::assertSame(['crm.contact','crm.edit'],array_map(static fn($a)=>$a->actionKey,$snapshot->actions));
        self::assertFalse($snapshot->actions[0]->executable);

        $commands=new CommandSurface($domains,$inspector,$this->builder(),30);
        $result=$commands->search('customer',$snapshot->context);
        self::assertContains('inspect',array_map(static fn($i)=>$i->kind,$result->items));
        self::assertContains('workspace',array_map(static fn($i)=>$i->kind,$result->items));
        self::assertContains('action',array_map(static fn($i)=>$i->kind,$result->items));
        foreach ($result->items as $item) self::assertFalse($item->executable);
    }

    public function test_action_registry_rejects_unknown_object_targets(): void
    {
        $objects=new InMemoryObjectRegistry();
        $objects->rebuild(['crm'=>['objects'=>[]]]);
        $actions=new InMemoryActionRegistry($objects);
        $snapshot=$actions->rebuild(['bad'=>['actions'=>[ $this->action('bad.edit',['missing.object'],['command'],[]) ]]]);
        self::assertArrayHasKey('bad',$snapshot->rejected);
        self::assertSame([],$snapshot->actions);
    }

    private function fixture(): array
    {
        $domains=new InMemoryDomainRegistry();
        $domains->rebuild(['crm'=>['domains'=>[['key'=>'customers','label'=>'Customers','layer'=>'business','product_surfaces'=>['command'],'intent_surfaces'=>['home','ask','work','do'],'object_refs'=>['crm.customer'],'default_view_refs'=>[],'priority'=>10]]]]);
        $objects=new InMemoryObjectRegistry();
        $objects->rebuild(['crm'=>['objects'=>[['key'=>'crm.customer','label'=>'Customer','data_authority'=>'crm','scope'=>['type'=>'tenant','tenant_key'=>'company_id'],'product_surfaces'=>['command'],'customer_safe'=>true,'permissions'=>['crm.view'],'lifecycle_ref'=>null,'facet_refs'=>[],'view_refs'=>[],'action_refs'=>['crm.edit','crm.contact'],'relationship_refs'=>[],'offline_mode'=>'read-only']]]]);
        $facets=new InMemoryFacetRegistry($objects); $facets->rebuild(['crm'=>['facets'=>[]]]);
        $actions=new InMemoryActionRegistry($objects);
        $actions->rebuild(['crm'=>['actions'=>[
            $this->action('crm.edit',['crm.customer'],['command'],['crm.update'],'crm.update'),
            $this->action('crm.contact',['crm.customer'],['command'],['crm.contact'],null,['kind'=>'wizard','ref'=>'contact-v1']),
        ]]]);
        $inspector=new ContextInspector($objects,$domains,$actions,new ObjectWorkspaceComposer($objects,$facets),$this->builder());
        $context=new InterfaceContext(7,11,'command','customers',capabilities:['crm.view','crm.update','crm.contact']);
        return [$domains,$objects,$actions,$inspector,$context];
    }

    private function action(string $key,array $applies,array $surfaces,array $permissions,?string $capability='x',?array $interaction=null): array
    {
        return ['key'=>$key,'label'=>$key,'applies_to'=>$applies,'mutating'=>true,'capability_ref'=>$capability,'interaction'=>$interaction,'product_surfaces'=>$surfaces,'permissions'=>$permissions,'offline_mode'=>'online-required','requires_confirmation'=>false,'container_hint'=>'drawer'];
    }

    private function builder(): BuilderPresentationAdapter
    {
        return new BuilderPresentationAdapter(new ArrayComponentVocabulary([
            'drawer'=>['id'=>'drawer','authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
            'command-palette'=>['id'=>'command-palette','authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
            'stack'=>['id'=>'stack','authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
        ]),new PresentationComponentPolicy());
    }
}
