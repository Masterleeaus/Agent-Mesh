<?php

declare(strict_types=1);

namespace Tests\Architecture;

use PHPUnit\Framework\TestCase;

final class ExtensionBlueprintContractTest extends TestCase
{
    public function test_magicai_blueprint_v31_lifecycle_contract_is_declared(): void
    {
        $root = dirname(__DIR__, 2);
        $installer = json_decode((string) file_get_contents($root.'/extension.json'), true, flags: JSON_THROW_ON_ERROR);
        $sidecar = json_decode((string) file_get_contents($root.'/extension.manifest.json'), true, flags: JSON_THROW_ON_ERROR);
        $provider = (string) file_get_contents($root.'/System/TitanBuilderServiceProvider.php');

        self::assertSame('titan-extension-v1', $installer['schema']);
        self::assertSame('titan-builder', $installer['slug']);
        self::assertSame('TitanBuilder', $installer['folder']);
        self::assertSame('App\\Extensions\\TitanBuilder\\System\\TitanBuilderServiceProvider', $installer['provider']);
        self::assertTrue(version_compare((string) $installer['version'], '0.8.0', '>='));
        self::assertSame($installer['name'], $sidecar['name']);
        self::assertSame($installer['version'], $sidecar['version']);
        self::assertSame('TitanBuilder', $sidecar['folder']);
        self::assertSame('native', $sidecar['family']);
        self::assertSame('company_id', $sidecar['data']['tenant_key']);
        self::assertSame('retain', $sidecar['data']['default_uninstall_policy']);
        self::assertTrue($sidecar['lifecycle']['register_key']);
        self::assertTrue($sidecar['lifecycle']['uninstall']);
        self::assertTrue($sidecar['lifecycle']['idempotent']);
        self::assertStringContainsString('ExtensionRegisterKeyProviderInterface', $provider);
        self::assertStringContainsString('UninstallExtensionServiceProviderInterface', $provider);
        self::assertStringContainsString("return 'titan-builder';", $provider);
        self::assertStringNotContainsString("publishes(\$extensionPublishables, 'extension')", $provider);
        self::assertStringContainsString("publishes(\$extensionPublishables, 'titan-builder')", $provider);
    }
}
