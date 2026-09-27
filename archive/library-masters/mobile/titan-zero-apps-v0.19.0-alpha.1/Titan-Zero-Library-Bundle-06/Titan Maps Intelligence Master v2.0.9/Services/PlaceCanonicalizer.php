<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\DTO\ExternalPlaceData;

final class PlaceCanonicalizer
{
    public function canonicalKey(ExternalPlaceData $place): string
    {
        if ($place->providerPlaceId !== '') {
            return strtolower(trim($place->provider)).':'.trim($place->providerPlaceId);
        }
        return 'derived:'.hash('sha256', implode('|', [
            $this->normalizeText($place->name),
            $this->normalizeText((string) $place->address),
            $this->normalizePhone($place->phone),
            $this->normalizeDomain($place->website),
        ]));
    }

    public function normalizePhone(?string $phone): string
    {
        $digits = preg_replace('/\D+/', '', (string) $phone) ?? '';
        if (str_starts_with($digits, '61') && strlen($digits) >= 11) {
            $local = substr($digits, 2);
            $digits = str_starts_with($local, '0') ? $local : '0'.$local;
        }
        return $digits;
    }

    public function normalizeDomain(?string $website): string
    {
        $value = trim((string) $website);
        if ($value === '') { return ''; }
        if (! str_contains($value, '://')) { $value = 'https://'.$value; }
        $host = strtolower((string) parse_url($value, PHP_URL_HOST));
        return preg_replace('/^www\./', '', $host) ?? $host;
    }

    public function normalizeEmail(?string $email): string
    {
        return strtolower(trim((string) $email));
    }

    public function normalizeText(?string $value): string
    {
        $value = strtolower(trim((string) $value));
        $value = preg_replace('/\b(pty|ltd|limited|inc|llc|company|co)\b\.?/i', '', $value) ?? $value;
        return trim(preg_replace('/[^a-z0-9]+/', ' ', $value) ?? $value);
    }
}
