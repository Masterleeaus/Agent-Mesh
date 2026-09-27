<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

use App\Extensions\TitanMapsIntelligence\DTO\SpatialExecutionContext;

interface SpatialRiskGateway
{
    /** @return array{available:bool,allowed:?bool,reference:?string,reason_codes:array,level?:string} */
    public function evaluate(SpatialExecutionContext $context, array $policy, array $input, array $evidence = []): array;
}
