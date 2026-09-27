<?php

declare(strict_types=1);

namespace Tests\Unit\Extensions\TitanInterfaceRuntime;

use App\Extensions\TitanInterfaceRuntime\System\Discovery\InterfaceContributionDiscovery;
use App\Extensions\TitanInterfaceRuntime\System\Discovery\InterfaceContributionValidator;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryInterfaceContributionRegistry;
use PHPUnit\Framework\TestCase;

final class ContributionDiscoveryTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        parent::setUp();
        $this->root = sys_get_temp_dir() . '/tir-discovery-' . bin2hex(random_bytes(6));
        mkdir($this->root, 0777, true);
    }

    protected function tearDown(): void
    {
        $it = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($this->root, \FilesystemIterator::SKIP_DOTS), \RecursiveIteratorIterator::CHILD_FIRST);
        foreach ($it as $item) $item->isDir() ? rmdir($item->getPathname()) : unlink($item->getPathname());
        @rmdir($this->root);
        parent::tearDown();
    }

    public function test_valid_invalid_missing_duplicate_and_disabled_are_isolated(): void
    {
        $this->fixture('Valid', 'valid-one', true);
        $this->fixture('Invalid', 'invalid-one', true, mutate: static function (array $m): array { $m['domains'][0]['object_refs'] = ['missing.object']; return $m; });
        $this->fixture('Missing', 'missing-one', true, writeContribution: false);
        $this->fixture('Disabled', 'disabled-one', false);
        $this->fixture('DuplicateA', 'duplicate-one', true);
        $this->fixture('DuplicateB', 'duplicate-one', true);

        $registry = new InMemoryInterfaceContributionRegistry();
        $snapshot = (new InterfaceContributionDiscovery($registry, new InterfaceContributionValidator(), $this->root))->discover();

        self::assertTrue($registry->has('valid-one'));
        self::assertFalse($registry->has('invalid-one'));
        self::assertFalse($registry->has('missing-one'));
        self::assertFalse($registry->has('duplicate-one'));
        self::assertSame('VALID', $snapshot->health['Valid']->status);
        self::assertSame('DEGRADED', $snapshot->health['Invalid']->status);
        self::assertSame('DEGRADED', $snapshot->health['Missing']->status);
        self::assertSame('DISABLED', $snapshot->health['Disabled']->status);
        self::assertSame('DEGRADED', $snapshot->health['DuplicateA']->status);
        self::assertSame('DEGRADED', $snapshot->health['DuplicateB']->status);
        self::assertSame(1, $snapshot->summary()['registered']);
    }

    /** @param null|callable(array<string,mixed>):array<string,mixed> $mutate */
    private function fixture(string $folder, string $key, bool $enabled, ?callable $mutate = null, bool $writeContribution = true): void
    {
        $dir = $this->root . '/' . $folder;
        mkdir($dir . '/resources/interface', 0777, true);
        file_put_contents($dir . '/extension.manifest.json', json_encode([
            'key' => $key,
            'interface_contribution' => ['enabled' => $enabled, 'contract_version' => '1.0', 'manifest' => 'resources/interface/interface-manifest.json'],
        ], JSON_PRETTY_PRINT));
        if (! $writeContribution) return;
        $manifest = [
            'schema_version' => '1.0', 'extension_key' => $key,
            'context' => ['required' => ['company_id','user_id','product_surface','domain'], 'optional' => []],
            'domains' => [['key' => 'platform', 'label' => 'Platform', 'layer' => 'platform', 'product_surfaces' => ['command'], 'intent_surfaces' => ['home'], 'object_refs' => [], 'default_view_refs' => []]],
            'objects' => [], 'facets' => [], 'views' => [], 'actions' => [], 'lifecycles' => [], 'global_work' => [],
            'providers' => ['attention' => [], 'decisions' => [], 'insights' => []], 'legacy_data_surfaces' => [],
        ];
        if ($mutate) $manifest = $mutate($manifest);
        file_put_contents($dir . '/resources/interface/interface-manifest.json', json_encode($manifest, JSON_PRETTY_PRINT));
    }
}
