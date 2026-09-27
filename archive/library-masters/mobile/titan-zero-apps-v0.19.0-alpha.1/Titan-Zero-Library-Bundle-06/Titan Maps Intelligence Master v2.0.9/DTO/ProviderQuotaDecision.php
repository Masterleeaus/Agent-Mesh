<?php
declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\DTO;
final class ProviderQuotaDecision
{
    public function __construct(
        public readonly string $status,
        public readonly bool $providerAllowed,
        public readonly bool $fallbackAllowed,
        public readonly int $usageCount,
        public readonly int $limit,
        public readonly int $softLimitPercent,
        public readonly bool $overrideActive=false,
    ) {}
    public function toArray(): array { return ['status'=>$this->status,'provider_allowed'=>$this->providerAllowed,'fallback_allowed'=>$this->fallbackAllowed,'usage_count'=>$this->usageCount,'limit'=>$this->limit,'soft_limit_percent'=>$this->softLimitPercent,'override_active'=>$this->overrideActive]; }
}
