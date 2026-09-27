<?php

declare(strict_types=1);

namespace Tests\Architecture\Extensions\TitanMapsIntelligence;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class MigrationSchemaContractTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        parent::setUp();
        $this->root = dirname(__DIR__, 2);
    }

    public function test_existing_maps_domain_declares_real_migrations(): void
    {
        $manifest = $this->json('extension.manifest.json');

        self::assertTrue($manifest['database']['migrations']);
        self::assertDirectoryExists($this->root.'/database/migrations');

        $files = glob($this->root.'/database/migrations/*.php') ?: [];
        self::assertGreaterThanOrEqual(count($manifest['database']['owned_tables']), count($files));
    }

    #[DataProvider('ownedTableProvider')]
    public function test_each_owned_table_has_company_scoped_forward_only_migration(string $table): void
    {
        $matches = glob($this->root.'/database/migrations/*_create_'.$table.'_table.php') ?: [];
        self::assertCount(1, $matches, $table);

        $source = (string) file_get_contents($matches[0]);
        self::assertStringContainsString("Schema::hasTable('{$table}')", $source, $table);
        self::assertStringContainsString("Schema::create('{$table}'", $source, $table);
        self::assertStringContainsString("string('company_id', 64)", $source, $table);
        self::assertMatchesRegularExpression("/company[^'\"]*_idx/", $source, $table);
        self::assertStringContainsString('->timestamps()', $source, $table);
        self::assertStringContainsString('public function down(): void', $source, $table);
        self::assertStringNotContainsString('Schema::drop', $source, $table);
    }

    public function test_schema_contract_covers_every_persistent_model_fillable_field(): void
    {
        $contract = $this->json('database/schema-contract.json');
        $modelTables = [];

        foreach (glob($this->root.'/Models/*.php') ?: [] as $file) {
            if (basename($file) === 'CompanyScopedModel.php') {
                continue;
            }

            $source = (string) file_get_contents($file);
            self::assertSame(1, preg_match("~protected \\$table = '([^']+)'~", $source, $tableMatch), basename($file));
            $table = $tableMatch[1];
            $modelTables[] = $table;
            self::assertArrayHasKey($table, $contract, basename($file));

            self::assertSame(1, preg_match('~protected \\$fillable = \\[(.*?)\\];~s', $source, $fillableMatch), basename($file));
            preg_match_all("/'([^']+)'/", $fillableMatch[1], $fields);
            foreach ($fields[1] as $field) {
                self::assertContains($field, $contract[$table], basename($file).':'.$field);
            }
        }

        sort($modelTables);
        $contractTables = array_keys($contract);
        sort($contractTables);
        self::assertSame($contractTables, $modelTables);
    }

    public function test_service_provider_loads_extension_migrations(): void
    {
        $source = (string) file_get_contents($this->root.'/System/TitanMapsIntelligenceServiceProvider.php');
        self::assertStringContainsString("loadMigrationsFrom(__DIR__.'/../database/migrations')", $source);
    }

    public static function ownedTableProvider(): array
    {
        $root = dirname(__DIR__, 2);
        $manifest = json_decode((string) file_get_contents($root.'/extension.manifest.json'), true, flags: JSON_THROW_ON_ERROR);

        return array_map(
            static fn (string $table): array => [$table],
            (array) ($manifest['database']['owned_tables'] ?? []),
        );
    }

    private function json(string $relative): array
    {
        $decoded = json_decode(
            (string) file_get_contents($this->root.'/'.$relative),
            true,
            flags: JSON_THROW_ON_ERROR,
        );
        self::assertIsArray($decoded);

        return $decoded;
    }
}
