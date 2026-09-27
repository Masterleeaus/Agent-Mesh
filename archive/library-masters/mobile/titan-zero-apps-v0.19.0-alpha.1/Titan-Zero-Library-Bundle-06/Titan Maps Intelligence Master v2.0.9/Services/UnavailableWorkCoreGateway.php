<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\WorkCoreCandidateGateway;
use App\Extensions\TitanMapsIntelligence\Contracts\WorkCoreCandidateLookup;
use App\Extensions\TitanMapsIntelligence\Exceptions\MissingHostContractException;

final class UnavailableWorkCoreGateway implements WorkCoreCandidateGateway, WorkCoreCandidateLookup
{
    public function promote(string $companyId, string $targetType, array $fields, array $context): array
    {
        throw $this->unavailable();
    }

    public function find(string $companyId, string $entityType, string $entityId): ?array
    {
        throw $this->unavailable();
    }

    private function unavailable(): MissingHostContractException
    {
        return MissingHostContractException::fromCode(
            'MAPS_WORKCORE_ADAPTER_UNAVAILABLE',
            'The Titan host does not provide a WorkCore Maps adapter. Discovery remains installable, but WorkCore matching, promotion, and field-reference projection require that adapter.',
        );
    }
}
