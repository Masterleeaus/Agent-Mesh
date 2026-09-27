<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\DTO\ExternalPlaceData;
use DateTimeInterface;

final class ProvenanceService
{
    /** @return list<array{field:string,value:mixed,provider:string,source_url:?string,observed_at:string,confidence:float,restrictions:array,observation_type:string}> */
    public function observations(ExternalPlaceData $place, DateTimeInterface $observedAt): array
    {
        $observations = [];
        foreach ($place->toArray() as $field => $value) {
            if ($value === null || $value === '' || $value === []) {
                continue;
            }

            $observations[] = [
                'field' => $field,
                'value' => $value,
                'provider' => $place->provider,
                'source_url' => $place->sourceUrl,
                'observed_at' => $observedAt->format(DATE_ATOM),
                'confidence' => $this->confidenceFor($field, $value),
                'restrictions' => (array) ($place->providerMetadata['storage_restrictions'] ?? []),
                'observation_type' => 'provider_observed',
            ];
        }

        return $observations;
    }

    private function confidenceFor(string $field, mixed $value): float
    {
        if (in_array($field, ['provider', 'provider_place_id', 'name'], true)) {
            return 1.0;
        }

        if (in_array($field, ['latitude', 'longitude', 'address', 'phone', 'website'], true)) {
            return 0.9;
        }

        if (in_array($field, ['rating', 'review_count', 'currently_open'], true)) {
            return 0.8;
        }

        return is_array($value) ? 0.75 : 0.7;
    }
}
