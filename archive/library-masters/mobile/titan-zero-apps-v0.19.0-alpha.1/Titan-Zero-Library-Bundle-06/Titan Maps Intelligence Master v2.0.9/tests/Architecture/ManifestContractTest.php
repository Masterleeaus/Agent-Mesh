<?php

declare(strict_types=1);

namespace Tests\Architecture\Extensions\TitanMapsIntelligence;

use PHPUnit\Framework\TestCase;

final class ManifestContractTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        parent::setUp();
        $this->root = dirname(__DIR__, 2);
    }

    public function test_primary_manifest_matches_titan_extension_manager_contract(): void
    {
        $manifest = $this->json('extension.json');

        self::assertSame('titan-extension-v1', $manifest['schema']);
        self::assertSame('titan-maps-intelligence', $manifest['slug']);
        self::assertSame('TitanMapsIntelligence', $manifest['folder']);
        self::assertSame(
            'App\\Extensions\\TitanMapsIntelligence\\System\\TitanMapsIntelligenceServiceProvider',
            $manifest['provider'],
        );
        self::assertTrue($manifest['migrations']);
    }

    public function test_manifest_pair_has_matching_release_identity(): void
    {
        $installer = $this->json('extension.json');
        $sidecar = $this->json('extension.manifest.json');

        self::assertSame($installer['name'], $sidecar['name']);
        self::assertSame($installer['version'], $sidecar['version']);
        self::assertSame($installer['slug'], $sidecar['key']);
        self::assertSame($installer['folder'], $sidecar['folder']);
        self::assertSame($installer['provider'], $sidecar['provider']);
        self::assertSame($installer['migrations'], $sidecar['database']['migrations']);
    }

    public function test_sidecar_declares_company_tenant_boundary_and_vault_credentials(): void
    {
        $sidecar = $this->json('extension.manifest.json');

        self::assertSame('company_id', $sidecar['data']['tenant_key']);
        self::assertSame('credential-vault', $sidecar['data']['credential_storage']);
        self::assertTrue($sidecar['queues']['tenant_context_required']);
    }

    public function test_declared_provider_exists_in_system_folder(): void
    {
        $installer = $this->json('extension.json');
        $sidecar = $this->json('extension.manifest.json');
        $prefix = $sidecar['namespace'].'\\';

        self::assertStringStartsWith($prefix, $installer['provider']);
        $relativeClass = substr($installer['provider'], strlen($prefix));
        $relativeFile = str_replace('\\', DIRECTORY_SEPARATOR, $relativeClass).'.php';

        self::assertFileExists($this->root.DIRECTORY_SEPARATOR.$relativeFile);
    }

    private function json(string $relative): array
    {
        $decoded = json_decode(
            (string) file_get_contents($this->root.DIRECTORY_SEPARATOR.$relative),
            true,
            flags: JSON_THROW_ON_ERROR,
        );

        self::assertIsArray($decoded);
        return $decoded;
    }
}
