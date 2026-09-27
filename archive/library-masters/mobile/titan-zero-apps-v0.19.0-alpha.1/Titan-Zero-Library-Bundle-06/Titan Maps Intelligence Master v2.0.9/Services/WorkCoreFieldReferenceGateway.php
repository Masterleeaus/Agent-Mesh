<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\FieldReferenceGateway;
use App\Extensions\TitanMapsIntelligence\Contracts\WorkCoreCandidateLookup;
use App\Extensions\TitanMapsIntelligence\DTO\FieldReference;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;

final class WorkCoreFieldReferenceGateway implements FieldReferenceGateway
{
    public function __construct(private readonly WorkCoreCandidateLookup $lookup) {}

    public function resolve(string $companyId, string $referenceType, string $publicReferenceId): ?FieldReference
    {
        $companyId = trim($companyId);
        $publicReferenceId = trim($publicReferenceId);
        if ($companyId === '' || $publicReferenceId === '') {
            throw MapsIntelligenceException::fromCode('MAPS_REFERENCE_INVALID', 'A company and public reference ID are required.');
        }
        if (! in_array($referenceType, FieldReference::supportedTypes(), true)) {
            throw MapsIntelligenceException::fromCode('MAPS_REFERENCE_TYPE_INVALID', 'Unsupported field reference type.', ['reference_type' => $referenceType]);
        }

        $record = $this->lookup->find($companyId, $referenceType, $publicReferenceId);
        if ($record === null) {
            return null;
        }

        if (($record['deleted_at'] ?? null) !== null || array_key_exists('active', $record) && $record['active'] === false) {
            return null;
        }

        $resolvedCompanyId = trim((string) ($record['company_id'] ?? $companyId));
        if ($resolvedCompanyId === '' || ! hash_equals($companyId, $resolvedCompanyId)) {
            return null;
        }

        $address = $record['postal_address'] ?? $record['address'] ?? null;
        if (! is_string($address) || trim($address) === '') {
            $address = null;
        } else {
            $address = trim($address);
        }

        return new FieldReference(
            companyId: $companyId,
            referenceType: $referenceType,
            publicReferenceId: $publicReferenceId,
            postalAddress: $address,
            branchId: isset($record['branch_id']) ? (string) $record['branch_id'] : null,
            workspaceId: isset($record['workspace_id']) ? (string) $record['workspace_id'] : null,
        );
    }
}
