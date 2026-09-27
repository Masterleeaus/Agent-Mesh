<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('discovery_runs')) {
            return;
        }

        Schema::create('discovery_runs', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id', 64)->index('dr_company_idx');
            $table->string('branch_id', 64)->nullable();
            $table->string('workspace_id', 64)->nullable();
            $table->uuid('discovery_search_id');
            $table->string('provider', 64);
            $table->text('cursor')->nullable();
            $table->string('current_stage', 64)->default('queued');
            $table->unsignedInteger('attempts')->default(0);
            $table->unsignedInteger('results_discovered')->default(0);
            $table->unsignedInteger('results_processed')->default(0);
            $table->unsignedInteger('results_skipped')->default(0);
            $table->unsignedInteger('duplicates_detected')->default(0);
            $table->unsignedInteger('failures')->default(0);
            $table->json('rate_limit_state')->nullable();
            $table->timestamp('retry_after')->nullable();
            $table->json('checkpoint')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->string('failure_code', 96)->nullable();
            $table->text('safe_failure_details')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'id'], 'dr_company_id_uq');
            $table->unique(['company_id', 'discovery_search_id', 'provider'], 'dr_company_search_provider_uq');
            $table->index(['company_id', 'current_stage', 'retry_after'], 'dr_company_stage_retry_idx');
            $table->foreign(['company_id', 'discovery_search_id'], 'dr_search_tenant_fk')
                ->references(['company_id', 'id'])->on('discovery_searches');
        });
    }

    public function down(): void
    {
        // Forward-safe MagicAI lifecycle: package uninstall does not rely on migration rollback.
    }
};
