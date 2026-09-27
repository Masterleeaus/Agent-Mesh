<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\ProductSurface;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\ProductSurface\ProductSurfaceProjection;

interface ProductSurfacePolicyProjectorContract
{
    public function project(InterfaceContext $context): ProductSurfaceProjection;
}
