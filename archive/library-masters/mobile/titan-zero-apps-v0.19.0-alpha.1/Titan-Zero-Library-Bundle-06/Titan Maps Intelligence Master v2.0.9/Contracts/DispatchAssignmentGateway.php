<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

use App\Extensions\TitanMapsIntelligence\DTO\DispatchJobContext;

interface DispatchAssignmentGateway
{
    /** @param array<string,mixed> $candidate @param array<string,mixed> $options @return array<string,mixed> */
    public function assign(string $companyId, DispatchJobContext $job, array $candidate, array $options = []): array;
}
