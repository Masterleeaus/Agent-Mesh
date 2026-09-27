<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('maps_usage_records')) {
            return;
        }

        Schema::create('maps_usage_records', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id', 64)->index('mur_company_idx');
            $table->string('branch_id', 64)->nullable();
            $table->string('workspace_id', 64)->nullable();
            $table->string('provider', 64);
            $table->string('operation', 96);
            $table->unsignedInteger('request_count')->default(0);
            $table->unsignedInteger('result_count')->default(0);
            $table->decimal('billable_units', 14, 4)->default(0);
            $table->decimal('estimated_cost', 14, 6)->nullable();
            $table->string('currency', 8)->nullable();
            $table->uuid('discovery_search_id')->nullable();
            $table->string('user_id', 64)->nullable();
            $table->string('agent_id', 64)->nullable();
            $table->dateTime('recorded_at');
            $table->timestamps();

            $table->unique(['company_id', 'id'], 'mur_company_id_uq');
            $table->index(['company_id', 'provider', 'operation', 'recorded_at'], 'mur_provider_operation_idx');
            $table->index(['company_id', 'discovery_search_id'], 'mur_company_search_idx');
            $table->index(['company_id', 'recorded_at'], 'mur_company_recorded_idx');
            $table->foreign(['company_id', 'discovery_search_id'], 'mur_search_tenant_fk')
                ->references(['company_id', 'id'])->on('discovery_searches');
        });
    }

    public function down(): void
    {
        // Forward-safe MagicAI lifecycle: package uninstall does not rely on migration rollback.
    }
};
