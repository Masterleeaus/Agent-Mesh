<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

use App\Extensions\TitanMapsIntelligence\DTO\SpatialExecutionContext;

interface SpatialKnowledgeGateway
{
    /** @return array{available:bool,references:array,reason_codes:array} */
    public function resolveJurisdiction(SpatialExecutionContext $context, array $location, array $scope = []): array;
}
