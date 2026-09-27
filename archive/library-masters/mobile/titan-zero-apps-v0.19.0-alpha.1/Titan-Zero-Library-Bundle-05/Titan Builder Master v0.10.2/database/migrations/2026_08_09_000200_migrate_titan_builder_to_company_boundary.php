<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Forward-only v0.3 -> v0.4 bridge.
 *
 * Fresh v0.4 installs already receive company_id from the 000100 migration.
 * Existing v0.3 installs are upgraded in two phases:
 *   1. add/backfill company_id and prove every legacy row is mapped;
 *   2. remove tenant_id and create the company-scoped indexes.
 *
 * If even one legacy row cannot be mapped safely, the migration aborts before
 * any legacy boundary column is removed. Runtime code never reads tenant_id.
 */
return new class extends Migration {
    /** @var array<string, array{index: string, unique?: array<int,string>, composite?: array<int,string>, composite_name?: string}> */
    private array $tables = [
        'titan_builder_projects' => [
            'index' => 'titan_builder_projects_company_id_index',
            'unique' => ['company_id', 'slug'],
        ],
        'titan_builder_versions' => [
            'index' => 'titan_builder_versions_company_id_index',
            'unique' => ['company_id', 'project_id', 'version'],
        ],
        'titan_builder_pages' => [
            'index' => 'titan_builder_pages_company_id_index',
            'unique' => ['company_id', 'project_id', 'slug'],
        ],
        'titan_builder_page_specs' => [
            'index' => 'titan_builder_page_specs_company_id_index',
            'composite' => ['company_id', 'page_id', 'id'],
            'composite_name' => 'titan_builder_page_specs_company_page_id_index',
        ],
        'titan_builder_themes' => [
            'index' => 'titan_builder_themes_company_id_index',
            'unique' => ['company_id', 'project_id', 'slug'],
        ],
        'titan_builder_templates' => [
            'index' => 'titan_builder_templates_company_id_index',
            'unique' => ['company_id', 'project_id', 'slug'],
        ],
        'titan_builder_assets' => [
            'index' => 'titan_builder_assets_company_id_index',
            'composite' => ['company_id', 'checksum'],
            'composite_name' => 'titan_builder_assets_company_checksum_index',
        ],
        'titan_builder_publish_snapshots' => [
            'index' => 'titan_builder_publish_snapshots_company_id_index',
            'unique' => ['company_id', 'project_id', 'version'],
        ],
        'titan_builder_ai_generation_jobs' => [
            'index' => 'titan_builder_ai_generation_jobs_company_id_index',
            'composite' => ['company_id', 'status'],
            'composite_name' => 'titan_builder_ai_jobs_company_status_index',
        ],
    ];

    public function up(): void
    {
        $legacyTables = [];
        $unresolved = [];

        foreach ($this->tables as $table => $definition) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'tenant_id')) {
                continue;
            }

            $legacyTables[] = $table;

            if (! Schema::hasColumn($table, 'company_id')) {
                Schema::table($table, function (Blueprint $blueprint): void {
                    $blueprint->unsignedBigInteger('company_id')->nullable()->after('id');
                });
            }

            DB::table($table)
                ->select(['id', 'tenant_id'])
                ->whereNull('company_id')
                ->chunkById(250, function ($rows) use ($table): void {
                    foreach ($rows as $row) {
                        $legacy = trim((string) ($row->tenant_id ?? ''));
                        if ($legacy === '' || ! ctype_digit($legacy)) {
                            continue;
                        }

                        $companyId = (int) $legacy;
                        if ($companyId < 1) {
                            continue;
                        }

                        DB::table($table)
                            ->where('id', $row->id)
                            ->whereNull('company_id')
                            ->update(['company_id' => $companyId]);
                    }
                });

            $remaining = (int) DB::table($table)->whereNull('company_id')->count();
            if ($remaining > 0) {
                $unresolved[$table] = $remaining;
            }
        }

        if ($unresolved !== []) {
            $details = [];
            foreach ($unresolved as $table => $count) {
                $details[] = $table.':'.$count;
            }

            throw new \RuntimeException(
                'Titan Builder v0.4 company migration requires explicit company_id mapping for unresolved legacy rows: '.implode(', ', $details)
            );
        }

        foreach ($legacyTables as $table) {
            $definition = $this->tables[$table];

            Schema::table($table, function (Blueprint $blueprint): void {
                $blueprint->dropColumn('tenant_id');
            });

            Schema::table($table, function (Blueprint $blueprint) use ($table, $definition): void {
                $blueprint->index('company_id', $definition['index']);

                if (isset($definition['unique'])) {
                    $blueprint->unique($definition['unique'], $this->uniqueIndexName($table));
                }

                if (isset($definition['composite'], $definition['composite_name'])) {
                    $blueprint->index($definition['composite'], $definition['composite_name']);
                }
            });
        }
    }

    public function down(): void
    {
        // Intentionally forward-only. Reintroducing tenant_id would weaken the canonical company boundary.
    }

    private function uniqueIndexName(string $table): string
    {
        return match ($table) {
            'titan_builder_projects' => 'titan_builder_projects_company_slug_unique',
            'titan_builder_versions' => 'titan_builder_versions_company_project_version_unique',
            'titan_builder_pages' => 'titan_builder_pages_company_project_slug_unique',
            'titan_builder_themes' => 'titan_builder_themes_company_project_slug_unique',
            'titan_builder_templates' => 'titan_builder_templates_company_project_slug_unique',
            'titan_builder_publish_snapshots' => 'titan_builder_snapshots_company_project_version_unique',
            default => throw new \RuntimeException('No company unique index is defined for '.$table),
        };
    }
};
