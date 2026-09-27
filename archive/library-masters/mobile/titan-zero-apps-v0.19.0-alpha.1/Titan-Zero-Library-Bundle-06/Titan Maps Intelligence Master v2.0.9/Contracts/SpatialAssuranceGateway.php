<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

use App\Extensions\TitanMapsIntelligence\DTO\SpatialExecutionContext;

interface SpatialAssuranceGateway
{
    /** @return array{available:bool,supported:?bool,reference:?string,reason_codes:array,level?:string} */
    public function evaluate(SpatialExecutionContext $context, array $policy, array $input, array $evidence = []): array;
}
