<?php
declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Services;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialSignalPublisher;
use App\Extensions\TitanMapsIntelligence\DTO\ProviderQuotaDecision;
use App\Extensions\TitanMapsIntelligence\Exceptions\ProviderException;
use App\Extensions\TitanMapsIntelligence\Models\MapProviderQuotaPolicy;
use App\Extensions\TitanMapsIntelligence\Models\MapsUsageRecord;
use Carbon\CarbonImmutable;
final class ProviderQuotaGuard
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly MapsConfiguration $configuration,
        private readonly ProviderQuotaPolicy $policy,
        private readonly SpatialSignalPublisher $signals,
        private readonly SpatialExecutionContextFactory $contextFactory,
        private readonly SpatialExecutionContextStore $contextStore,
    ){}
    public function status(string $provider): array
    {
        return $this->statusForCompany($this->context->companyId(), $provider);
    }

    public function statusForCompany(string $company, string $provider): array
    {
        $now=CarbonImmutable::now('UTC');
        $configured=MapProviderQuotaPolicy::query()->forCompany($company)->where('provider',$provider)->where('enabled',true)->first();
        $dailyLimit=(int)($configured?->daily_request_limit ?? $this->configuration->providerQuotaDailyRequestLimit());
        $monthlyLimit=(int)($configured?->monthly_request_limit ?? $this->configuration->providerQuotaMonthlyRequestLimit());
        $soft=(int)($configured?->soft_limit_percent ?? $this->configuration->providerQuotaSoftLimitPercent());
        $override=(bool)($configured?->override_until && $configured->override_until->isFuture());
        $daily=(int)MapsUsageRecord::query()->forCompany($company)->where('provider',$provider)->where('recorded_at','>=',$now->startOfDay())->sum('request_count');
        $monthly=(int)MapsUsageRecord::query()->forCompany($company)->where('provider',$provider)->where('recorded_at','>=',$now->startOfMonth())->sum('request_count');
        $dayDecision=$this->policy->decide($daily,$dailyLimit,$soft,$override);
        $monthDecision=$this->policy->decide($monthly,$monthlyLimit,$soft,$override);
        $severity=['allowed'=>0,'override'=>0,'soft_limited'=>1,'hard_limited'=>2];
        $decision=($severity[$monthDecision->status]??0)>($severity[$dayDecision->status]??0)?$monthDecision:$dayDecision;
        return ['provider'=>$provider,'status'=>$decision->status,'provider_allowed'=>$decision->providerAllowed,'fallback_allowed'=>$decision->fallbackAllowed,'daily'=>['used'=>$daily,'limit'=>$dailyLimit],'monthly'=>['used'=>$monthly,'limit'=>$monthlyLimit],'soft_limit_percent'=>$soft,'override_active'=>$override,'override_until'=>$configured?->override_until?->toAtomString()];
    }
    public function enforce(string $provider,string $operation,bool $supportsFallback=true): ProviderQuotaDecision
    {
        return $this->enforceForCompany($this->context->companyId(), $provider, $operation, $supportsFallback);
    }

    public function enforceForCompany(string $companyId,string $provider,string $operation,bool $supportsFallback=true): ProviderQuotaDecision
    {
        $s=$this->statusForCompany($companyId,$provider); $decision=new ProviderQuotaDecision((string)$s['status'],(bool)$s['provider_allowed'],(bool)$s['fallback_allowed'],(int)$s['daily']['used'],(int)$s['daily']['limit'],(int)$s['soft_limit_percent'],(bool)$s['override_active']);
        if($decision->providerAllowed) return $decision;
        $ctx=$this->contextStore->current() ?? $this->contextFactory->fromInput('maps.provider.quota.guard',['execution_origin'=>'system']);
        $payload=['provider'=>$provider,'operation'=>$operation,'status'=>$decision->status,'daily'=>$s['daily'],'monthly'=>$s['monthly'],'soft_limit_percent'=>$decision->softLimitPercent];
        if($decision->status==='hard_limited'){
            $this->signals->publish('maps.provider.quota.exceeded',$ctx,$payload);
            throw ProviderException::fromCode('MAPS_PROVIDER_QUOTA_EXCEEDED','Maps provider hard quota has been reached.',['provider'=>$provider,'operation'=>$operation,'http_status'=>429,'quota'=>$s]);
        }
        $this->signals->publish('maps.provider.quota.soft_limit',$ctx,$payload);
        if($supportsFallback) throw ProviderException::fromCode('MAPS_PROVIDER_QUOTA_SOFT_LIMIT','Maps provider soft quota reached; cached or offline-safe fallback is required.',['provider'=>$provider,'operation'=>$operation,'quota'=>$s]);
        return $decision;
    }
    public function override(string $provider,int $minutes,string $reason): MapProviderQuotaPolicy
    {
        $minutes=max(1,min(1440,$minutes));
        return MapProviderQuotaPolicy::query()->updateOrCreate(['company_id'=>$this->context->companyId(),'provider'=>$provider],[
            'daily_request_limit'=>$this->configuration->providerQuotaDailyRequestLimit(),'monthly_request_limit'=>$this->configuration->providerQuotaMonthlyRequestLimit(),'soft_limit_percent'=>$this->configuration->providerQuotaSoftLimitPercent(),'enabled'=>true,
            'override_until'=>CarbonImmutable::now('UTC')->addMinutes($minutes),'override_reason'=>trim($reason),'overridden_by_user_id'=>$this->context->userId(),'metadata'=>['emergency_override'=>true],
        ]);
    }
}
