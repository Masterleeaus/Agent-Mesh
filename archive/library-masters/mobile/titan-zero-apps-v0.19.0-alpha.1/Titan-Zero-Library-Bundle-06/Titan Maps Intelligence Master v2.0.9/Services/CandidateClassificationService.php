<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

final class CandidateClassificationService
{
    /** @return array{type:string,confidence:float,evidence:array} */
    public function classify(array $place, string $purpose): array
    {
        $categories = array_map('strtolower', array_values(array_filter([
            $place['primary_category'] ?? null,
            ...((array) ($place['categories'] ?? [])),
        ], 'is_string')));

        $type = match ($purpose) {
            'provider_discovery', 'emergency_sourcing' => 'provider_candidate',
            'supplier_discovery' => 'supplier_candidate',
            'sales_lead_discovery' => 'sales_lead',
            'competitor_analysis' => 'competitor',
            'accommodation_discovery' => $this->containsAny($categories, ['lodging', 'hotel', 'motel', 'serviced_apartment'])
                ? 'accommodation_provider'
                : 'property_operator',
            default => 'unclassified',
        };

        return [
            'type' => $type,
            'confidence' => $type === 'unclassified' ? 0.0 : 0.8,
            'evidence' => [
                'purpose' => $purpose,
                'categories' => $categories,
                'basis' => 'deterministic_rules',
            ],
        ];
    }

    private function containsAny(array $values, array $needles): bool
    {
        foreach ($needles as $needle) {
            if (in_array($needle, $values, true)) {
                return true;
            }
        }

        return false;
    }
}
