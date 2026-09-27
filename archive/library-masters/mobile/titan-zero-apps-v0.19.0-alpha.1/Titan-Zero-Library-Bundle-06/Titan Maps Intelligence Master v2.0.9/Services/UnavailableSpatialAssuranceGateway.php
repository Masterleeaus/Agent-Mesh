<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Services;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialAssuranceGateway;
use App\Extensions\TitanMapsIntelligence\DTO\SpatialExecutionContext;
final class UnavailableSpatialAssuranceGateway implements SpatialAssuranceGateway
{
    public function evaluate(SpatialExecutionContext $context,array $policy,array $input,array $evidence=[]): array
    { return ['available'=>false,'supported'=>null,'reference'=>null,'reason_codes'=>['ASSURANCE_ENGINE_UNAVAILABLE']]; }
}
