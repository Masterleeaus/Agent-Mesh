<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Http\Controllers;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\InterfaceContextStoreContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\ProductSurface\ProductSurfacePolicyProjectorContract;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

final class ProductSurfacePolicyController extends Controller
{
    public function __invoke(InterfaceContextStoreContract $contexts, ProductSurfacePolicyProjectorContract $projector): JsonResponse
    {
        return response()->json($projector->project($contexts->requireCurrent())->jsonSerialize());
    }
}
