<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Collection;

use App\Extensions\TitanInterfaceRuntime\System\Authority\AuthorizedViewReader;
use App\Extensions\TitanInterfaceRuntime\System\Authority\ReadQuery;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Collection\CollectionViewPreferenceStoreContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Collection\CollectionViewSwitcherContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ViewRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationNode;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationTree;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ResponsiveHints;
use App\Extensions\TitanInterfaceRuntime\System\Registry\ViewDescriptor;

final readonly class CollectionViewSwitcher implements CollectionViewSwitcherContract
{
    public function __construct(
        private ViewRegistryContract $views,
        private AuthorizedViewReader $reader,
        private BuilderPresentationAdapter $presentation,
        private CollectionViewPreferenceStoreContract $preferences,
    ) {}

    public function open(string $objectKey,InterfaceContext $context,ReadQuery $query,?string $requestedViewKey=null):CollectionViewSnapshot
    {
        $eligible=$this->eligibleViews($objectKey,$context);
        if ($eligible===[]) throw new CollectionViewSwitchException("No collection views are available for object '{$objectKey}'.");
        $preferred=$requestedViewKey ?? $this->preferences->get($context,$objectKey);
        $selected=$preferred!==null ? $this->findEligible($eligible,$preferred) : null;
        if ($requestedViewKey!==null && $selected===null) throw new CollectionViewSwitchException("Requested collection view '{$requestedViewKey}' is unavailable or unsafe in this context.");
        $selected ??= $eligible[0];
        $switchable=$this->sameAuthoritySet($eligible,$selected);
        $source=$this->reader->read($selected->key,$context,$query);
        $this->preferences->put($context,$objectKey,$selected->key);
        return $this->snapshot($objectKey,$context,$query,$selected,$switchable,$source);
    }

    public function reproject(CollectionViewSnapshot $snapshot,string $viewKey,InterfaceContext $context):CollectionViewSnapshot
    {
        $this->assertSameContext($snapshot,$context);
        $target=null;
        foreach ($snapshot->views as $option) if ($option->viewKey===$viewKey) { $target=$this->views->find($viewKey); break; }
        if (! $target instanceof ViewDescriptor || ! $target->visibleIn($context)) {
            throw new CollectionViewSwitchException("Collection view '{$viewKey}' is not switchable in the current view set.");
        }
        if ($target->dataAuthority!==$snapshot->sourceAuthority || $target->dataMode!==$snapshot->sourceMode || $target->dataReference!==$snapshot->sourceReference) {
            throw new CollectionViewSwitchException('Collection view switch attempted to change read authority or source semantics.');
        }
        $this->preferences->put($context,$snapshot->objectKey,$viewKey);
        return $this->snapshot($snapshot->objectKey,$context,$snapshot->query,$target,array_values(array_filter(array_map(fn(CollectionViewOption $o)=>$this->views->find($o->viewKey),$snapshot->views),fn($v)=>$v instanceof ViewDescriptor)),$snapshot->source);
    }

    /** @return list<ViewDescriptor> */
    private function eligibleViews(string $objectKey,InterfaceContext $context):array
    {
        $views=array_values(array_filter($this->views->forObject($objectKey),static fn(ViewDescriptor $v):bool=>
            CollectionViewCatalog::supported($v->kind) && $v->visibleIn($context)
        ));
        usort($views,static fn(ViewDescriptor $a,ViewDescriptor $b):int=>[CollectionViewCatalog::order($a->kind),strtolower($a->label),$a->key]<=>[CollectionViewCatalog::order($b->kind),strtolower($b->label),$b->key]);
        return $views;
    }

    private function findEligible(array $eligible,string $key):?ViewDescriptor
    {
        foreach ($eligible as $view) if ($view->key===$key) return $view;
        return null;
    }

    /** @param list<ViewDescriptor> $eligible @return list<ViewDescriptor> */
    private function sameAuthoritySet(array $eligible,ViewDescriptor $selected):array
    {
        return array_values(array_filter($eligible,static fn(ViewDescriptor $v):bool=>
            $v->dataAuthority===$selected->dataAuthority && $v->dataMode===$selected->dataMode && $v->dataReference===$selected->dataReference
        ));
    }

    /** @param list<ViewDescriptor> $switchable */
    private function snapshot(string $objectKey,InterfaceContext $context,ReadQuery $query,ViewDescriptor $selected,array $switchable,\App\Extensions\TitanInterfaceRuntime\System\Authority\AuthorityReadResult $source):CollectionViewSnapshot
    {
        $options=array_map(static fn(ViewDescriptor $v):CollectionViewOption=>CollectionViewOption::fromDescriptor($v),$switchable);
        $hint=$selected->componentHint ?: CollectionViewCatalog::defaultHint($selected->kind);
        $component=$this->presentation->resolve($hint,CollectionViewCatalog::container($selected->kind),ResponsiveHints::required());
        $tree=new PresentationTree($context->productSurface,new PresentationNode('component','collection-view',[
            'component'=>$component->jsonSerialize(),'object_key'=>$objectKey,'selected_view_key'=>$selected->key,'view_kind'=>$selected->kind,
            'available_views'=>array_map(static fn(CollectionViewOption $o):array=>$o->jsonSerialize(),$options),
            'source_binding'=>['authority'=>$selected->dataAuthority,'mode'=>$selected->dataMode,'reference'=>$selected->dataReference],
            'query_fingerprint'=>$query->fingerprint(),'projection_only'=>true,'map_projection'=>'spatial-workspace',
        ]),ResponsiveHints::required(),['authority'=>'presentation-only','view_switching'=>'same-authority-only','query_state_preserved'=>true]);
        return new CollectionViewSnapshot($objectKey,$context->companyId,$context->userId,$context->productSurface,$context->domain,$selected->key,$selected->dataAuthority,$selected->dataMode,$selected->dataReference,$query,$source,$options,$tree);
    }

    private function assertSameContext(CollectionViewSnapshot $snapshot,InterfaceContext $context):void
    {
        if ($snapshot->companyId!==$context->companyId || $snapshot->userId!==$context->userId || $snapshot->productSurface!==$context->productSurface || $snapshot->domain!==$context->domain) {
            throw new CollectionViewSwitchException('Collection projection context changed; reopen the collection under the new authorized context.');
        }
    }
}
