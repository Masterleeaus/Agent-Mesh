<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Spatial;

use App\Extensions\TitanInterfaceRuntime\System\Authority\AuthorizedViewReader;
use App\Extensions\TitanInterfaceRuntime\System\Authority\ReadQuery;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ActionRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ObjectRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ViewRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Spatial\SpatialWorkspaceContract;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationNode;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationTree;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ResponsiveHints;
use App\Extensions\TitanInterfaceRuntime\System\Registry\ActionDescriptor;
use App\Extensions\TitanInterfaceRuntime\System\Registry\ViewDescriptor;

final readonly class SpatialWorkspaceComposer implements SpatialWorkspaceContract
{
    public const MAPS_AUTHORITY = 'titan-maps-intelligence';

    public function __construct(
        private ObjectRegistryContract $objects,
        private ViewRegistryContract $views,
        private ActionRegistryContract $actions,
        private AuthorizedViewReader $reader,
        private BuilderPresentationAdapter $presentation,
        private ?SpatialPayloadNormalizer $normalizer = null,
    ) {}

    public function open(string $objectKey, InterfaceContext $context, ReadQuery $query, ?string $requestedViewKey = null): SpatialWorkspaceSnapshot
    {
        $object=$this->objects->get($objectKey);
        if ($object===null) throw new SpatialWorkspaceException("Unknown or unavailable spatial object '{$objectKey}'.");
        if (! $object->visibleIn($context)) throw new SpatialWorkspaceException('Object is not safe or visible on the active product surface.');
        foreach ($object->permissions as $permission) if (! $context->hasCapability($permission)) throw new SpatialWorkspaceException('Object permission requirements are not satisfied.');

        $view=$this->selectMapView($objectKey,$context,$requestedViewKey);
        if ($view->dataAuthority!==self::MAPS_AUTHORITY) throw new SpatialWorkspaceException('Spatial map views must delegate authoritative spatial reads to Titan Maps Intelligence.');
        if ($view->dataMode==='legacy-route') throw new SpatialWorkspaceException('Spatial workspaces may not use legacy-route as their map authority.');

        $source=$this->reader->read($view->key,$context,$query);
        $normalizer=$this->normalizer ?? new SpatialPayloadNormalizer($this->objects);
        $spatial=$normalizer->normalize($source->data,$context);
        $actionIntents=$this->spatialActions($objectKey,$context);
        $component=$this->presentation->resolve($view->componentHint ?: 'map','map',ResponsiveHints::required());

        $tree=new PresentationTree($context->productSurface,new PresentationNode('component','spatial-workspace',[
            'container'=>'map','component'=>$component->jsonSerialize(),'object_key'=>$objectKey,'view_key'=>$view->key,
            'source_binding'=>['authority'=>$view->dataAuthority,'mode'=>$view->dataMode,'reference'=>$view->dataReference],
            'query_fingerprint'=>$query->fingerprint(),'maps_authoritative'=>true,'projection_only'=>true,
            'layers'=>$spatial['layers'],'pins'=>$spatial['pins'],'candidates'=>$spatial['candidates'],'routes'=>$spatial['routes'],
            'territories'=>$spatial['territories'],'traffic'=>$spatial['traffic'],'spatial_actions'=>$actionIntents,
        ]),ResponsiveHints::required(),[
            'authority'=>'presentation-only','spatial_authority'=>self::MAPS_AUTHORITY,'calculations_owned_by_maps'=>true,
            'actions_are_intents_only'=>true,'manifest_opt_in_required'=>true,
        ]);

        return new SpatialWorkspaceSnapshot(
            objectKey:$objectKey,viewKey:$view->key,companyId:(string)$context->companyId,userId:(string)$context->userId,
            productSurface:$context->productSurface,sourceAuthority:$view->dataAuthority,sourceMode:$view->dataMode,sourceReference:$view->dataReference,
            queryFingerprint:$query->fingerprint(),layers:$spatial['layers'],pins:$spatial['pins'],candidates:$spatial['candidates'],routes:$spatial['routes'],
            territories:$spatial['territories'],traffic:$spatial['traffic'],provenance:$source->provenance,diagnostics:$spatial['diagnostics'],presentation:$tree,
        );
    }

    private function selectMapView(string $objectKey, InterfaceContext $context, ?string $requestedViewKey): ViewDescriptor
    {
        $eligible=array_values(array_filter($this->views->forObject($objectKey),static fn(ViewDescriptor $view):bool =>
            $view->kind==='map' && $view->visibleIn($context)
        ));
        usort($eligible,static fn(ViewDescriptor $a,ViewDescriptor $b):int=>[strtolower($a->label),$a->key]<=>[strtolower($b->label),$b->key]);
        if ($requestedViewKey!==null) {
            foreach ($eligible as $view) if ($view->key===$requestedViewKey) return $view;
            $known=$this->views->find($requestedViewKey);
            if ($known!==null && $known->kind!=='map') throw new SpatialWorkspaceException("View '{$requestedViewKey}' is not a map/spatial view.");
            throw new SpatialWorkspaceException("Requested map view '{$requestedViewKey}' is unavailable or unsafe in this context.");
        }
        if ($eligible===[]) throw new SpatialWorkspaceException("Object '{$objectKey}' has no manifest-declared map view for the current context.");
        return $eligible[0];
    }

    /** @return list<array<string,mixed>> */
    private function spatialActions(string $objectKey, InterfaceContext $context): array
    {
        $actions=array_values(array_filter($this->actions->forObject($objectKey,$context),static fn(ActionDescriptor $action):bool=>$action->containerHint==='map'));
        usort($actions,static fn(ActionDescriptor $a,ActionDescriptor $b):int=>[$a->mutating?1:0,strtolower($a->label),$a->key]<=>[$b->mutating?1:0,strtolower($b->label),$b->key]);
        return array_map(static fn(ActionDescriptor $action):array=>[
            'key'=>$action->key,'label'=>$action->label,'mutating'=>$action->mutating,'capability_ref'=>$action->capabilityRef,
            'interaction'=>$action->interaction,'requires_confirmation'=>$action->requiresConfirmation,'offline_mode'=>$action->offlineMode,
            'customer_safe'=>$action->customerSafe,'execution_authority'=>$action->interaction!==null?'interaction-engine':'capability','executable'=>false,
        ],$actions);
    }
}
