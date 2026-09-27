<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\ProductSurface;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\ProductSurface\ProductSurfaceProfile;
use App\Extensions\TitanInterfaceRuntime\System\Registry\ActionDescriptor;
use App\Extensions\TitanInterfaceRuntime\System\Registry\FacetDescriptor;
use App\Extensions\TitanInterfaceRuntime\System\Registry\ObjectDescriptor;
use App\Extensions\TitanInterfaceRuntime\System\Registry\ViewDescriptor;

interface ProductSurfacePolicyContract
{
    public function profile(InterfaceContext $context): ProductSurfaceProfile;
    public function allowsObject(ObjectDescriptor $object, InterfaceContext $context): bool;
    public function allowsFacet(FacetDescriptor $facet, InterfaceContext $context): bool;
    public function allowsView(ViewDescriptor $view, InterfaceContext $context): bool;
    public function allowsAction(ActionDescriptor $action, InterfaceContext $context): bool;
}
