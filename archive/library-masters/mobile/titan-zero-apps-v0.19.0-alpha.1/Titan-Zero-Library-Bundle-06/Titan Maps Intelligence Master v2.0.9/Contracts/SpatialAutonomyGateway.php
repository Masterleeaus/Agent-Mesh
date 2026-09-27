<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

use App\Extensions\TitanMapsIntelligence\DTO\SpatialExecutionContext;

interface SpatialAutonomyGateway
{
    /** @return array{available:bool,allowed:?bool,effective_autonomy:?string,reference:?string,reason_codes:array} */
    public function decide(SpatialExecutionContext $context, array $policy, array $input, array $evidence = []): array;
}
