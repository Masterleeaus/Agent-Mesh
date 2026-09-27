<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

final class GeocodeRetryPolicy
{
    public function retryAfterSeconds(int $failureCount): ?int
    {
        return match ($failureCount) {
            1 => 300,
            2 => 3600,
            3, 4 => 86400,
            default => null,
        };
    }

    public function isBlockedAfterFailureCount(int $failureCount): bool
    {
        return $failureCount >= 5;
    }

    public function fingerprint(string $address): string
    {
        $value = trim($address);
        $value = function_exists('mb_strtolower') ? mb_strtolower($value, 'UTF-8') : strtolower($value);
        // Punctuation variations should not create a separate provider cache/retry identity.
        $value = preg_replace('/[^\p{L}\p{N}]+/u', ' ', $value) ?? $value;
        $value = trim(preg_replace('/\s+/u', ' ', $value) ?? $value);
        return hash('sha256', $value);
    }

    public function confidenceForPrecision(?string $precision): string
    {
        $precision = strtoupper(trim((string) $precision));
        return match ($precision) {
            'ROOFTOP', 'PREMISE', 'SUB_PREMISE' => 'high',
            'RANGE_INTERPOLATED', 'STREET', 'ROUTE' => 'medium',
            default => 'low',
        };
    }

    public function providerVersion(string $provider): string
    {
        return match (strtolower(trim($provider))) {
            'google-geocoding' => 'google-geocoding-v4',
            default => strtolower(trim($provider)).'-provider-contract-v1',
        };
    }
}
