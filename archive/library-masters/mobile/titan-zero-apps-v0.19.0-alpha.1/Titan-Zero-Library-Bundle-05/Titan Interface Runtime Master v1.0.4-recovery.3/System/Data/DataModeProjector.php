<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Data;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Data\DataModeProjectorContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Data\LegacyRouteLocatorContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\LegacyDataSurfaceRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ObjectRegistryContract;

final readonly class DataModeProjector implements DataModeProjectorContract
{
    /** @param list<string> $allowedProductSurfaces */
    public function __construct(private LegacyDataSurfaceRegistryContract $registry,private LegacyRouteLocatorContract $routes,private array $allowedProductSurfaces=['command','go','onboarding'],private ?ObjectRegistryContract $objects=null){}
    public function forObject(string $objectKey, InterfaceContext $context): DataModeProjection
    {
        $surfaces=[];$omitted=[];
        if(!in_array($context->productSurface,$this->allowedProductSurfaces,true))return new DataModeProjection($objectKey,[],['product-surface-denied']);
        if($this->objects!==null){
            $object=$this->objects->get($objectKey);
            if($object===null)return new DataModeProjection($objectKey,[],['unknown-object']);
            if(!$object->visibleIn($context))return new DataModeProjection($objectKey,[],['object-surface-denied']);
            foreach($object->permissions as $permission)if(!$context->hasCapability($permission))return new DataModeProjection($objectKey,[],['object-permission-denied']);
        }
        foreach($this->registry->forObject($objectKey) as $surface){
            if(!$surface->authorizedBy($context->capabilities)){$omitted[]=$surface->key.':permission';continue;}
            $url=$this->routes->url($surface->routeName);
            if($url===null){$omitted[]=$surface->key.':route-unavailable';continue;}
            $surfaces[]=new DataModeSurface($surface->key,$surface->routeName,$url,'deep-link','legacy-route');
        }
        return new DataModeProjection($objectKey,$surfaces,$omitted);
    }
}
