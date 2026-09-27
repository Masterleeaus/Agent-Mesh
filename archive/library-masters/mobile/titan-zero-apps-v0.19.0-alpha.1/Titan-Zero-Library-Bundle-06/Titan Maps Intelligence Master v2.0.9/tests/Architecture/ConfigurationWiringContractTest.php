<?php

declare(strict_types=1);

namespace Tests\Architecture\Extensions\TitanMapsIntelligence;

use PHPUnit\Framework\TestCase;

final class ConfigurationWiringContractTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        parent::setUp();
        $this->root = dirname(__DIR__, 2);
    }

    public function test_algorithm_services_depend_on_validated_configuration(): void
    {
        self::assertStringContainsString('MapsConfiguration $configuration', $this->source('Services/ProviderRankingService.php'));
        self::assertStringContainsString('MapsConfiguration $configuration', $this->source('Services/CandidateMatchingService.php'));
        self::assertStringNotContainsString('private const WEIGHTS', $this->source('Services/ProviderRankingService.php'));
        self::assertStringNotContainsString('$score >= 0.86', $this->source('Services/CandidateMatchingService.php'));
        self::assertStringNotContainsString('$score >= 0.62', $this->source('Services/CandidateMatchingService.php'));
    }

    public function test_search_and_provider_limits_are_configuration_driven(): void
    {
        self::assertStringContainsString('$this->configuration->maximumResults()', $this->source('Services/MapsCapabilityService.php'));
        self::assertStringContainsString('$this->configuration->maximumRadiusMetres()', $this->source('Services/MapsCapabilityService.php'));
        self::assertStringContainsString('$configuration->maximumProviderPageSize()', $this->source('Jobs/ProcessDiscoveryPage.php'));
        self::assertStringContainsString("\$this->config['page_size']", $this->source('Providers/GooglePlacesProvider.php'));
    }

    public function test_configuration_version_is_written_into_auditable_workflows(): void
    {
        self::assertStringContainsString("\$providerStrategy['configuration_version']", $this->source('Services/DiscoverySearchService.php'));
        self::assertStringContainsString("'deterministic_weighted:'.\$this->configuration->version()", $this->source('Services/CandidateMatchWorkflow.php'));
    }

    private function source(string $relative): string
    {
        return (string) file_get_contents($this->root.'/'.$relative);
    }
}
