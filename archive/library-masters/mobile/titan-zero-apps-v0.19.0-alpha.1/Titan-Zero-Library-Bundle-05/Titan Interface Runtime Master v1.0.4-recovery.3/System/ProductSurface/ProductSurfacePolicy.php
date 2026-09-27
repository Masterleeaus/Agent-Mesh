<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\ProductSurface;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\ProductSurface\ProductSurfacePolicyContract;
use App\Extensions\TitanInterfaceRuntime\System\Registry\ActionDescriptor;
use App\Extensions\TitanInterfaceRuntime\System\Registry\FacetDescriptor;
use App\Extensions\TitanInterfaceRuntime\System\Registry\ObjectDescriptor;
use App\Extensions\TitanInterfaceRuntime\System\Registry\ViewDescriptor;

final readonly class ProductSurfacePolicy implements ProductSurfacePolicyContract
{
    public function profile(InterfaceContext $context): ProductSurfaceProfile
    {
        return match ($context->productSurface) {
            'command' => new ProductSurfaceProfile('command','owner-manager','comfortable',false,false,true,false,'full',12,['full-workspace','drawer','panel','table','board']),
            'go' => new ProductSurfaceProfile('go','field-worker','compact',true,true,false,false,'task-first',5,['card','panel','drawer','map','wizard']),
            'hub' => new ProductSurfaceProfile('hub','customer','simple',true,true,false,true,'customer-journey',4,['card','panel','wizard','chat']),
            'onboarding' => new ProductSurfaceProfile('onboarding','setup-operator','progressive',true,true,false,false,'stepwise',3,['wizard','card','panel','chat']),
            default => throw new \InvalidArgumentException("Unsupported product surface '{$context->productSurface}'."),
        };
    }

    public function allowsObject(ObjectDescriptor $object, InterfaceContext $context): bool
    {
        return $object->visibleIn($context);
    }

    public function allowsFacet(FacetDescriptor $facet, InterfaceContext $context): bool
    {
        return $facet->visibleIn($context);
    }

    public function allowsView(ViewDescriptor $view, InterfaceContext $context): bool
    {
        return $view->visibleIn($context);
    }

    public function allowsAction(ActionDescriptor $action, InterfaceContext $context): bool
    {
        return $action->visibleIn($context);
    }
}
