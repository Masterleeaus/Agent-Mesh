<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\DTO\RouteRequest;
use App\Extensions\TitanMapsIntelligence\DTO\TrafficEstimate;
use App\Extensions\TitanMapsIntelligence\Exceptions\ProviderException;
use App\Extensions\TitanMapsIntelligence\Providers\TrafficProviderRegistry;

final class TrafficService
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly TrafficProviderRegistry $providers,
        private readonly MapsConfiguration $configuration,
        private readonly ProviderUsageService $usage,
        private readonly ProviderQuotaGuard $quota,
        private readonly ProviderHealthService $health,
    ) {}

    public function estimate(RouteRequest $request, ?string $providerId = null): TrafficEstimate
    {
        $companyId=$this->context->companyId(); $provider=$providerId ?? $this->configuration->defaultTrafficProvider();
        $this->quota->enforce($provider,'traffic',true);
        try { $result=$this->providers->get($provider,$companyId)->traffic($request); $this->health->recordSuccess($provider); }
        catch(ProviderException $e){$this->health->recordFailure($provider,$e);throw $e;}
        $this->usage->record($companyId,$result->usage,['user_id'=>$this->context->userId()]); return $result;
    }
}
