<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;

final readonly class FieldReference
{
    private const TYPES = ['job', 'property', 'branch', 'worker', 'supplier', 'contractor'];

    public function __construct(
        public string $companyId,
        public string $referenceType,
        public string $publicReferenceId,
        public ?string $postalAddress = null,
        public ?string $branchId = null,
        public ?string $workspaceId = null,
    ) {
        if (trim($companyId) === '' || trim($publicReferenceId) === '') {
            throw MapsIntelligenceException::fromCode('MAPS_REFERENCE_INVALID', 'A field reference requires company and public reference identifiers.');
        }
        if (! in_array($referenceType, self::TYPES, true)) {
            throw MapsIntelligenceException::fromCode('MAPS_REFERENCE_TYPE_INVALID', 'Unsupported field reference type.', ['reference_type' => $referenceType]);
        }
    }

    public static function supportedTypes(): array
    {
        return self::TYPES;
    }
}
