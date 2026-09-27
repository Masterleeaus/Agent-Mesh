<?php

declare(strict_types=1);

namespace Tests\Architecture\Extensions\TitanMapsIntelligence;

use PHPUnit\Framework\TestCase;

final class HostPortabilityContractTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        parent::setUp();
        $this->root = dirname(__DIR__, 2);
    }

    public function test_provider_has_no_mandatory_host_specific_imports(): void
    {
        $provider = (string) file_get_contents($this->root.'/System/TitanMapsIntelligenceServiceProvider.php');
        self::assertDoesNotMatchRegularExpression('/^use App\\\\Titan\\\\Maps\\\\/m', $provider);
        self::assertStringContainsString('class_exists($hostClass)', $provider);
        self::assertStringContainsString('RequestAuthorisedCompanyContext::class', $provider);
        self::assertStringContainsString('LocalCapabilityRegistrar::class', $provider);
    }

    public function test_export_route_uses_extension_fallback_when_host_controller_is_absent(): void
    {
        $routes = (string) file_get_contents($this->root.'/routes/api.php');
        self::assertStringNotContainsString('use App\\Titan\\Maps\\MapsExportController;', $routes);
        self::assertStringContainsString("class_exists('App\\\\Titan\\\\Maps\\\\MapsExportController')", $routes);
        self::assertStringContainsString('ExportDownloadController::class', $routes);
    }
}
