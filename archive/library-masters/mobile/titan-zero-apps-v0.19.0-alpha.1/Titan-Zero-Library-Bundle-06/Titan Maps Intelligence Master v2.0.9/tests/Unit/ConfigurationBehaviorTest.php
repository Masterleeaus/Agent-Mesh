<?php

declare(strict_types=1);

namespace Tests\Unit\Extensions\TitanMapsIntelligence;

use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Services\CandidateMatchingService;
use App\Extensions\TitanMapsIntelligence\Services\MapsConfiguration;
use App\Extensions\TitanMapsIntelligence\Services\PlaceCanonicalizer;
use App\Extensions\TitanMapsIntelligence\Services\ProviderRankingService;
use PHPUnit\Framework\TestCase;

final class ConfigurationBehaviorTest extends TestCase
{
    private array $base;

    protected function setUp(): void
    {
        parent::setUp();
        $this->base = require dirname(__DIR__, 2).'/config/titan_maps_intelligence.php';
    }

    public function test_ranking_weights_change_score_without_code_changes(): void
    {
        $distance = $this->base;
        $distance['ranking']['weights'] = $this->rankingWeights(distance: 1.0);
        $distanceScore = (new ProviderRankingService(new MapsConfiguration($distance)))->rank($this->rankCandidate())->score;

        $category = $this->base;
        $category['ranking']['weights'] = $this->rankingWeights(category: 1.0);
        $categoryScore = (new ProviderRankingService(new MapsConfiguration($category)))->rank($this->rankCandidate())->score;

        self::assertSame(1.0, $distanceScore);
        self::assertSame(0.0, $categoryScore);
    }

    public function test_matching_weights_and_thresholds_change_status_without_code_changes(): void
    {
        $config = $this->base;
        $config['matching']['weights'] = [
            'provider_place_id' => 0.40, 'phone' => 0.15, 'domain' => 0.12, 'email' => 0.08,
            'address' => 0.08, 'proximity' => 0.06, 'name' => 0.06, 'category' => 0.05,
        ];
        $config['matching']['confirmed_threshold'] = 0.35;
        $config['matching']['ambiguous_threshold'] = 0.20;

        $service = new CandidateMatchingService(new MapsConfiguration($config), new PlaceCanonicalizer());
        $confirmed = $service->score(
            ['provider' => 'google-places', 'provider_place_id' => 'abc'],
            ['external_provider' => 'google-places', 'external_place_id' => 'abc'],
        );

        $config['matching']['weights']['provider_place_id'] = 0.20;
        $config['matching']['weights']['address'] = 0.28;
        $service = new CandidateMatchingService(new MapsConfiguration($config), new PlaceCanonicalizer());
        $ambiguous = $service->score(
            ['provider' => 'google-places', 'provider_place_id' => 'abc'],
            ['external_provider' => 'google-places', 'external_place_id' => 'abc'],
        );

        self::assertSame(0.4, $confirmed->score);
        self::assertSame('confirmed', $confirmed->status);
        self::assertSame(0.2, $ambiguous->score);
        self::assertSame('ambiguous', $ambiguous->status);
    }

    public function test_invalid_configuration_fails_closed(): void
    {
        $config = $this->base;
        $config['providers']['google-places']['retry_attempts'] = 4;

        $this->expectException(MapsIntelligenceException::class);
        new MapsConfiguration($config);
    }

    private function rankingWeights(float $distance = 0.0, float $category = 0.0): array
    {
        return [
            'distance' => $distance,
            'category' => $category,
            'rating' => 0.0,
            'review_count' => 0.0,
            'open_now' => 0.0,
            'contactability' => 0.0,
            'freshness' => 0.0,
        ];
    }

    private function rankCandidate(): array
    {
        return [
            'distance_km' => 0.0,
            'category_match' => 0.0,
            'rating' => 0.0,
            'review_count' => 0,
            'open_now' => false,
            'phone' => null,
            'website' => null,
            'data_freshness' => 0.0,
        ];
    }
}
