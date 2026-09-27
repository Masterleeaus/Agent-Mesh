<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\DTO\RankedCandidate;

final class ProviderRankingService
{
    public function __construct(private readonly MapsConfiguration $configuration) {}

    public function rank(array $candidate): RankedCandidate
    {
        $distanceCeiling = $this->configuration->rankingDistanceCeilingKm();
        $distanceKm = max(0.0, (float) ($candidate['distance_km'] ?? $this->configuration->rankingMissingDistanceKm()));
        $distance = max(0.0, 1.0 - min($distanceKm, $distanceCeiling) / $distanceCeiling);
        $category = max(0.0, min(1.0, (float) ($candidate['category_match'] ?? 0.0)));
        $rating = max(0.0, min(1.0, ((float) ($candidate['rating'] ?? 0.0)) / 5.0));
        $reviewCount = min(1.0, log10(max(1, (int) ($candidate['review_count'] ?? 0)) + 1) / $this->configuration->rankingReviewCountLogCeiling());
        $openNow = ($candidate['open_now'] ?? false) === true ? 1.0 : 0.0;
        $contactability = ((string) ($candidate['phone'] ?? '') !== '' ? 0.5 : 0.0) + ((string) ($candidate['website'] ?? '') !== '' ? 0.5 : 0.0);
        $freshness = max(0.0, min(1.0, (float) ($candidate['data_freshness'] ?? 0.0)));

        $signals = [
            'distance' => $distance,
            'category' => $category,
            'rating' => $rating,
            'review_count' => $reviewCount,
            'open_now' => $openNow,
            'contactability' => $contactability,
            'freshness' => $freshness,
        ];

        $breakdown = [];
        foreach ($this->configuration->rankingWeights() as $name => $weight) {
            $breakdown[$name] = round($signals[$name] * (float) $weight, 8);
        }

        return new RankedCandidate(round(array_sum($breakdown), 8), $breakdown);
    }
}
