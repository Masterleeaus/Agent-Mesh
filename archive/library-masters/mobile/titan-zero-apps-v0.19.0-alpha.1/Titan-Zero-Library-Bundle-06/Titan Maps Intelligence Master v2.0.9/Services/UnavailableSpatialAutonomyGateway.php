<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Services;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialAutonomyGateway;
use App\Extensions\TitanMapsIntelligence\DTO\SpatialExecutionContext;
final class UnavailableSpatialAutonomyGateway implements SpatialAutonomyGateway
{
    public function decide(SpatialExecutionContext $context,array $policy,array $input,array $evidence=[]): array
    { return ['available'=>false,'allowed'=>null,'effective_autonomy'=>null,'reference'=>null,'reason_codes'=>['AUTONOMY_ENGINE_UNAVAILABLE']]; }
}
