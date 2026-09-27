<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

interface WorkCoreCandidateLookup
{
    public function find(string $companyId, string $entityType, string $entityId): ?array;
}
