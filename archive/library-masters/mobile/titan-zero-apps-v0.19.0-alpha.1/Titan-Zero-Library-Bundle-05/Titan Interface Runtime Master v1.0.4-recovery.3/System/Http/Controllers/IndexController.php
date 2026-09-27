<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Http\Controllers;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\InterfaceContextStoreContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\TitanInterfaceRuntimeManagerContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Navigation\NavigationProjectorContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\DomainRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ObjectRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\FacetRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ViewRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\LegacyDataSurfaceRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\GlobalWorkRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ActionRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\DecisionProviderRegistryContract;
use App\Http\Controllers\Controller;
use Illuminate\Contracts\View\View;

final class IndexController extends Controller
{
    public function __invoke(
        TitanInterfaceRuntimeManagerContract $runtime,
        InterfaceContextStoreContract $contexts,
        DomainRegistryContract $domains,
        ObjectRegistryContract $objects,
        FacetRegistryContract $facets,
        ViewRegistryContract $views,
        LegacyDataSurfaceRegistryContract $legacyData,
        GlobalWorkRegistryContract $globalWork,
        ActionRegistryContract $actions,
        DecisionProviderRegistryContract $decisions,
        NavigationProjectorContract $navigation,
    ): View
    {
        $context = $contexts->requireCurrent();

        return view('titan-interface-runtime::index', [
            'health' => $runtime->health(),
            'boundaries' => $runtime->boundaries(),
            'context' => $context->jsonSerialize(),
            'domainRegistry' => $domains->snapshot()->jsonSerialize(),
            'objectRegistry' => $objects->snapshot()->jsonSerialize(),
            'facetRegistry' => $facets->snapshot()->jsonSerialize(),
            'viewRegistry' => $views->snapshot()->jsonSerialize(),
            'legacyDataRegistry' => $legacyData->snapshot()->jsonSerialize(),
            'globalWorkRegistry' => $globalWork->snapshot()->jsonSerialize(),
            'actionRegistry' => $actions->snapshot()->jsonSerialize(),
            'decisionProviderRegistry' => $decisions->snapshot()->jsonSerialize(),
            'navigation' => $navigation->project($context->productSurface, $context->domain, 'home')->jsonSerialize(),
        ]);
    }
}
