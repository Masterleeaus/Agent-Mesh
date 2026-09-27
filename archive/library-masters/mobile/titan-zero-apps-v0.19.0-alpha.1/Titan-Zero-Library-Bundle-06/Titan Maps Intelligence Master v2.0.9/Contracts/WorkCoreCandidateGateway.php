<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

interface WorkCoreCandidateGateway
{
    public function promote(string $companyId, string $targetType, array $fields, array $context): array;
}
