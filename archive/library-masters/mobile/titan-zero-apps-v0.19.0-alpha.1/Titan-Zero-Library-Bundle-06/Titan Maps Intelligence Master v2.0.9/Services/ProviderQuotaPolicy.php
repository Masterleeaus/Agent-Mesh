<?php
declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Services;
use App\Extensions\TitanMapsIntelligence\DTO\ProviderQuotaDecision;
final class ProviderQuotaPolicy
{
    public function decide(int $usageCount,int $limit,int $softLimitPercent,bool $overrideActive): ProviderQuotaDecision
    {
        $usageCount=max(0,$usageCount); $limit=max(1,$limit); $softLimitPercent=max(1,min(99,$softLimitPercent));
        if($overrideActive) return new ProviderQuotaDecision('override',true,true,$usageCount,$limit,$softLimitPercent,true);
        if($usageCount >= $limit) return new ProviderQuotaDecision('hard_limited',false,false,$usageCount,$limit,$softLimitPercent);
        $soft=(int)ceil($limit*($softLimitPercent/100));
        if($usageCount >= $soft) return new ProviderQuotaDecision('soft_limited',false,true,$usageCount,$limit,$softLimitPercent);
        return new ProviderQuotaDecision('allowed',true,true,$usageCount,$limit,$softLimitPercent);
    }
}
