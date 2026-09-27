<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('territory_analyses')) {
            return;
        }

        Schema::create('territory_analyses', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id', 64)->index('ta_company_idx');
            $table->string('branch_id', 64)->nullable();
            $table->string('workspace_id', 64)->nullable();
            $table->uuid('discovery_search_id');
            $table->json('search_area')->nullable();
            $table->json('categories')->nullable();
            $table->string('analysis_type', 64);
            $table->json('observation_period')->nullable();
            $table->json('result_summary')->nullable();
            $table->string('map_layer_reference', 500)->nullable();
            $table->json('generated_metrics')->nullable();
            $table->json('source_coverage')->nullable();
            $table->decimal('confidence', 6, 5)->nullable();
            $table->dateTime('generated_at');
            $table->timestamps();

            $table->unique(['company_id', 'id'], 'ta_company_id_uq');
            $table->index(['company_id', 'discovery_search_id', 'analysis_type'], 'ta_search_type_idx');
            $table->index(['company_id', 'analysis_type', 'generated_at'], 'ta_type_generated_idx');
            $table->foreign(['company_id', 'discovery_search_id'], 'ta_search_tenant_fk')
                ->references(['company_id', 'id'])->on('discovery_searches');
        });
    }

    public function down(): void
    {
        // Forward-safe MagicAI lifecycle: package uninstall does not rely on migration rollback.
    }
};
