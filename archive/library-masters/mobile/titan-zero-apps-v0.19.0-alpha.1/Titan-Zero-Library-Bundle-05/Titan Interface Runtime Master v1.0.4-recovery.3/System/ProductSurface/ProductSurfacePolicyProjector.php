<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\ProductSurface;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\ProductSurface\ProductSurfacePolicyContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\ProductSurface\ProductSurfacePolicyProjectorContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ActionRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\DomainRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\FacetRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ObjectRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ViewRegistryContract;

final readonly class ProductSurfacePolicyProjector implements ProductSurfacePolicyProjectorContract
{
    public function __construct(
        private ProductSurfacePolicyContract $policy,
        private DomainRegistryContract $domains,
        private ObjectRegistryContract $objects,
        private FacetRegistryContract $facets,
        private ViewRegistryContract $views,
        private ActionRegistryContract $actions,
    ) {}

    public function project(InterfaceContext $context): ProductSurfaceProjection
    {
        $profile=$this->policy->profile($context);
        $domains=array_keys($this->domains->visibleFor($context->productSurface));
        sort($domains,SORT_STRING);

        $objects=[];$viewMap=[];$facetMap=[];$actionMap=[];
        foreach ($this->objects->all() as $objectKey=>$object) {
            if (! $this->policy->allowsObject($object,$context)) continue;
            $objects[]=$objectKey;

            $views=[];
            foreach ($this->views->forObject($objectKey) as $view) {
                if ($this->policy->allowsView($view,$context)) $views[]=$view->key;
            }
            sort($views,SORT_STRING);
            $viewMap[$objectKey]=$views;

            $facets=array_keys($this->facets->forObject($objectKey,$context));
            sort($facets,SORT_STRING);
            $facetMap[$objectKey]=$facets;

            $actions=array_keys($this->actions->forObject($objectKey,$context));
            sort($actions,SORT_STRING);
            $actionMap[$objectKey]=[
                'primary'=>array_slice($actions,0,$profile->maxPrimaryActions),
                'secondary'=>array_slice($actions,$profile->maxPrimaryActions),
            ];
        }
        sort($objects,SORT_STRING);
        ksort($viewMap,SORT_STRING);ksort($facetMap,SORT_STRING);ksort($actionMap,SORT_STRING);

        return new ProductSurfaceProjection($profile,$domains,$objects,$viewMap,$facetMap,$actionMap);
    }
}
