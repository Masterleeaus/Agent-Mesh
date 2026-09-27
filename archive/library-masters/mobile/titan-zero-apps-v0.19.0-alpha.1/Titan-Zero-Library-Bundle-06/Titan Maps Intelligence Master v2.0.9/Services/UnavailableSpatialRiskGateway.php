<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Services;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialRiskGateway;
use App\Extensions\TitanMapsIntelligence\DTO\SpatialExecutionContext;
final class UnavailableSpatialRiskGateway implements SpatialRiskGateway
{
    public function evaluate(SpatialExecutionContext $context,array $policy,array $input,array $evidence=[]): array
    { return ['available'=>false,'allowed'=>null,'reference'=>null,'reason_codes'=>['RISK_ENGINE_UNAVAILABLE']]; }
}
