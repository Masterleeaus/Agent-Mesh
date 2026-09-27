<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Middleware;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Models\DiscoveryCandidate;
use App\Extensions\TitanMapsIntelligence\Models\DiscoverySearch;
use App\Extensions\TitanMapsIntelligence\Models\TerritoryAnalysis;
use App\Extensions\TitanMapsIntelligence\Models\RouteSnapshot;
use App\Extensions\TitanMapsIntelligence\Models\RoutePlan;
use App\Extensions\TitanMapsIntelligence\Models\DispatchRecommendation;
use App\Extensions\TitanMapsIntelligence\Models\ServiceTerritory;
use App\Extensions\TitanMapsIntelligence\Models\ResourceFallbackRequest;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

final class ResolveCompanyScopedRouteBindings
{
    /** @var array<string, class-string<Model>> */
    private const BINDINGS = [
        'mapsSearch' => DiscoverySearch::class,
        'mapsCandidate' => DiscoveryCandidate::class,
        'mapsAnalysis' => TerritoryAnalysis::class,
        'mapsTerritoryAnalysis' => TerritoryAnalysis::class,
        'mapsRouteSnapshot' => RouteSnapshot::class,
        'mapsRoutePlan' => RoutePlan::class,
        'mapsDispatchRecommendation' => DispatchRecommendation::class,
        'mapsServiceTerritory' => ServiceTerritory::class,
        'mapsResourceFallback' => ResourceFallbackRequest::class,
    ];

    public function __construct(private readonly AuthorisedCompanyContext $context) {}

    public function handle(Request $request, Closure $next): mixed
    {
        $route = $request->route();
        if ($route === null) {
            return $next($request);
        }

        $companyId = $this->context->companyId();
        foreach (self::BINDINGS as $parameter => $modelClass) {
            $value = $route->parameter($parameter);
            if ($value === null || $value instanceof Model) {
                continue;
            }

            /** @var Model $model */
            $model = $modelClass::query()
                ->where('company_id', $companyId)
                ->whereKey((string) $value)
                ->firstOrFail();

            $route->setParameter($parameter, $model);
        }

        return $next($request);
    }
}
