<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\DTO\RouteMatrixRequest;
use App\Extensions\TitanMapsIntelligence\DTO\RouteMatrixResult;
use App\Extensions\TitanMapsIntelligence\DTO\RouteRequest;
use App\Extensions\TitanMapsIntelligence\DTO\RouteResult;
use App\Extensions\TitanMapsIntelligence\Exceptions\ProviderException;
use App\Extensions\TitanMapsIntelligence\Providers\RoutingProviderRegistry;

final class RoutingService
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly RoutingProviderRegistry $providers,
        private readonly MapsConfiguration $configuration,
        private readonly ProviderUsageService $usage,
        private readonly ProviderQuotaGuard $quota,
        private readonly ProviderHealthService $health,
    ) {}

    public function route(RouteRequest $request, ?string $providerId = null): RouteResult
    {
        $companyId = $this->context->companyId();
        $provider = $providerId ?? $this->configuration->defaultRoutingProvider();
        $this->quota->enforce($provider, 'route', true);
        try {
            $result = $this->providers->get($provider, $companyId)->route($request);
            $this->health->recordSuccess($provider);
        } catch (ProviderException $exception) {
            $this->health->recordFailure($provider, $exception);
            throw $exception;
        }
        $this->usage->record($companyId, $result->usage, ['user_id'=>$this->context->userId()]);
        return $result;
    }

    public function matrix(RouteMatrixRequest $request, ?string $providerId = null): RouteMatrixResult
    {
        $companyId = $this->context->companyId();
        $provider = $providerId ?? $this->configuration->defaultRoutingProvider();
        $this->quota->enforce($provider, 'matrix', true);
        try {
            $result = $this->providers->get($provider, $companyId)->matrix($request);
            $this->health->recordSuccess($provider);
        } catch (ProviderException $exception) {
            $this->health->recordFailure($provider, $exception);
            throw $exception;
        }
        $this->usage->record($companyId, $result->usage, ['user_id'=>$this->context->userId()]);
        return $result;
    }
}
