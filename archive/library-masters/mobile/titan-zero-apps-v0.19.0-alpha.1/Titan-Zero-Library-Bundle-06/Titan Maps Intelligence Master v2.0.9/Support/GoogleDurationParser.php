<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Support;

use App\Extensions\TitanMapsIntelligence\Exceptions\ProviderException;

final class GoogleDurationParser
{
    public function seconds(?string $duration): ?int
    {
        if ($duration === null || $duration === '') {
            return null;
        }
        if (! preg_match('/^([0-9]+(?:\.[0-9]+)?)s$/', $duration, $matches)) {
            throw ProviderException::fromCode('MAPS_PROVIDER_INVALID_RESPONSE', 'Google returned an invalid duration value.');
        }

        return (int) round((float) $matches[1]);
    }
}
