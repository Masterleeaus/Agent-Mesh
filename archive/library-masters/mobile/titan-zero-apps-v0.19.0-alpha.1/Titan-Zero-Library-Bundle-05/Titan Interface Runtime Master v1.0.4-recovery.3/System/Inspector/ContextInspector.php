<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Inspector;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Inspector\ContextInspectorContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ActionRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\DomainRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ObjectRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Workspace\ObjectWorkspaceComposerContract;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReference;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationNode;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationTree;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ResponsiveHints;

final readonly class ContextInspector implements ContextInspectorContract
{
    public function __construct(
        private ObjectRegistryContract $objects,
        private DomainRegistryContract $domains,
        private ActionRegistryContract $actions,
        private ObjectWorkspaceComposerContract $workspaces,
        private BuilderPresentationAdapter $presentation,
    ) {}

    public function inspect(ObjectReference $reference, InterfaceContext $context): InspectorSnapshot
    {
        $resolved=$this->objects->resolve($reference,$context);
        $canonical=$reference->canonical();
        $domain=$this->domainFor($resolved->object->key,$context);
        $child=$context->with(['domain'=>$domain,'object_ref'=>$canonical]);
        $workspace=$this->workspaces->compose($reference,$child);
        $actionRefs=[];
        foreach ($this->actions->forObject($resolved->object->key,$child) as $action) {
            $actionRefs[]=InspectorActionReference::fromDescriptor($action,$canonical);
        }
        usort($actionRefs,static fn(InspectorActionReference $a,InspectorActionReference $b):int=>[strtolower($a->label),$a->actionKey]<=>[strtolower($b->label),$b->actionKey]);
        $target=new InspectorTarget('workspace',$canonical,$domain,false);
        $component=$this->presentation->resolve('drawer','drawer',ResponsiveHints::required());
        $tree=new PresentationTree(
            $child->productSurface,
            new PresentationNode('component','context-inspector',[
                'component'=>$component->jsonSerialize(),
                'object_ref'=>$canonical,
                'object_key'=>$resolved->object->key,
                'object_label'=>$resolved->object->label,
                'domain'=>$domain,
                'facet_loading'=>'lazy',
                'action_count'=>count($actionRefs),
                'workspace_target'=>$target->jsonSerialize(),
            ]),
            ResponsiveHints::required(),
            ['authority'=>'presentation-only','context_preserved'=>true,'full_workspace_optional'=>true],
        );
        return new InspectorSnapshot($resolved,$child,$workspace,$actionRefs,$target,$tree);
    }

    private function domainFor(string $objectKey, InterfaceContext $context): string
    {
        $current=$this->domains->get($context->domain);
        if ($current!==null && $current->visibleOn($context->productSurface) && in_array($objectKey,$current->objectRefs,true)) return $current->key;
        foreach ($this->domains->visibleFor($context->productSurface) as $domain) {
            if (in_array($objectKey,$domain->objectRefs,true)) return $domain->key;
        }
        return $context->domain;
    }
}
