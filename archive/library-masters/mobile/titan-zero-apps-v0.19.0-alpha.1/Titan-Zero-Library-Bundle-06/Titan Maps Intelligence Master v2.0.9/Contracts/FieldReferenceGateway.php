<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

use App\Extensions\TitanMapsIntelligence\DTO\FieldReference;

interface FieldReferenceGateway
{
    /**
     * Resolve an operational Field reference inside the supplied company boundary.
     * Implementations must return null for missing, deleted, inactive, or foreign-company records.
     */
    public function resolve(string $companyId, string $referenceType, string $publicReferenceId): ?FieldReference;
}
