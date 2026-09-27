<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\DTO\GeocodeRequest;
use App\Extensions\TitanMapsIntelligence\DTO\GeocodeResult;
use App\Extensions\TitanMapsIntelligence\DTO\ReverseGeocodeRequest;
use App\Extensions\TitanMapsIntelligence\Exceptions\ProviderException;
use App\Extensions\TitanMapsIntelligence\Providers\GeocodingProviderRegistry;

final class GeocodingService
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly GeocodingProviderRegistry $providers,
        private readonly MapsConfiguration $configuration,
        private readonly ProviderUsageService $usage,
        private readonly ProviderQuotaGuard $quota,
        private readonly ProviderHealthService $health,
    ) {}

    public function geocode(GeocodeRequest $request, ?string $providerId = null): GeocodeResult
    {
        $companyId=$this->context->companyId(); $provider=$providerId ?? $this->configuration->defaultGeocodingProvider();
        $this->quota->enforce($provider,'geocode',false);
        try { $result=$this->providers->get($provider,$companyId)->geocode($request); $this->health->recordSuccess($provider); }
        catch(ProviderException $e){$this->health->recordFailure($provider,$e);throw $e;}
        $this->usage->record($companyId,$result->usage,['user_id'=>$this->context->userId()]); return $result;
    }

    public function reverseGeocode(ReverseGeocodeRequest $request, ?string $providerId = null): GeocodeResult
    {
        $companyId=$this->context->companyId(); $provider=$providerId ?? $this->configuration->defaultGeocodingProvider();
        $this->quota->enforce($provider,'reverse_geocode',false);
        try { $result=$this->providers->get($provider,$companyId)->reverseGeocode($request); $this->health->recordSuccess($provider); }
        catch(ProviderException $e){$this->health->recordFailure($provider,$e);throw $e;}
        $this->usage->record($companyId,$result->usage,['user_id'=>$this->context->userId()]); return $result;
    }
}
