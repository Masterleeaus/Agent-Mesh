<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;

final class SuppressionService
{
    public function __construct(private readonly PlaceCanonicalizer $canonicalizer = new PlaceCanonicalizer()) {}

    public function normalise(string $type, string $value): string
    {
        return match ($type) {
            'domain' => $this->canonicalizer->normalizeDomain($value),
            'phone' => $this->canonicalizer->normalizePhone($value),
            'email' => $this->canonicalizer->normalizeEmail($value),
            'provider_place_id', 'canonical_key' => strtolower(trim($value)),
            default => throw MapsIntelligenceException::fromCode('MAPS_INVALID_SUPPRESSION_TYPE', 'The suppression type is not supported.'),
        };
    }

    public function matches(array $suppressions, array $candidate): bool
    {
        $candidateValues = [
            'domain' => $this->normalise('domain', (string) ($candidate['website'] ?? '')),
            'phone' => $this->normalise('phone', (string) ($candidate['phone'] ?? '')),
            'email' => $this->normalise('email', (string) ($candidate['public_email'] ?? '')),
            'provider_place_id' => $this->normalise('provider_place_id', (string) ($candidate['provider_place_id'] ?? '')),
            'canonical_key' => $this->normalise('canonical_key', (string) ($candidate['canonical_key'] ?? '')),
        ];

        foreach ($suppressions as $suppression) {
            $type = (string) ($suppression['suppression_type'] ?? '');
            $value = (string) ($suppression['normalised_value'] ?? '');
            if ($value !== '' && ($candidateValues[$type] ?? null) === $value) {
                return true;
            }
        }

        return false;
    }
}
