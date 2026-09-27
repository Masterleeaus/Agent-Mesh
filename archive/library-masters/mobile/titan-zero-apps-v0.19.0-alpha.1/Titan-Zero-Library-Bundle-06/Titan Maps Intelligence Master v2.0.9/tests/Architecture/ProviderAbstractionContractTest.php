<?php

declare(strict_types=1);

namespace Tests\Architecture\Extensions\TitanMapsIntelligence;

use PHPUnit\Framework\TestCase;

final class ProviderAbstractionContractTest extends TestCase
{
    private string $root;
    protected function setUp(): void { parent::setUp(); $this->root = dirname(__DIR__, 2); }

    public function test_operational_provider_contracts_are_vendor_neutral(): void
    {
        foreach (['GeocodingProvider', 'RoutingProvider', 'TrafficProvider'] as $contract) {
            $source = (string) file_get_contents($this->root.'/Contracts/'.$contract.'.php');
            self::assertStringNotContainsString('Google', $source);
        }
    }

    public function test_google_hosts_are_explicitly_allowlisted(): void
    {
        $source = (string) file_get_contents($this->root.'/Providers/LaravelProviderHttpTransport.php');
        foreach (['places.googleapis.com', 'geocode.googleapis.com', 'routes.googleapis.com'] as $host) {
            self::assertStringContainsString($host, $source);
        }
    }

    public function test_provider_usage_is_centralised_for_new_operational_services(): void
    {
        foreach (['GeocodingService.php', 'RoutingService.php', 'TrafficService.php'] as $file) {
            self::assertStringContainsString('$this->usage->record(', (string) file_get_contents($this->root.'/Services/'.$file));
        }
    }
}
