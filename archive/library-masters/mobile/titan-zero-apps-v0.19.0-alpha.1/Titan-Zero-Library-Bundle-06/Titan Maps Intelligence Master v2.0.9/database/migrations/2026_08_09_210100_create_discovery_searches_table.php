<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('discovery_searches')) {
            return;
        }

        Schema::create('discovery_searches', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id', 64)->index('ds_company_idx');
            $table->string('branch_id', 64)->nullable();
            $table->string('workspace_id', 64)->nullable();
            $table->string('requested_by_user_id', 64)->nullable();
            $table->string('conversation_id', 191)->nullable();
            $table->string('purpose', 64);
            $table->string('query', 500);
            $table->string('category', 128)->nullable();
            $table->json('categories')->nullable();
            $table->string('address', 500)->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 11, 7)->nullable();
            $table->unsignedInteger('radius_metres')->nullable();
            $table->decimal('north_boundary', 10, 7)->nullable();
            $table->decimal('south_boundary', 10, 7)->nullable();
            $table->decimal('east_boundary', 11, 7)->nullable();
            $table->decimal('west_boundary', 11, 7)->nullable();
            $table->string('language', 16)->nullable();
            $table->string('country', 8)->nullable();
            $table->json('filters')->nullable();
            $table->json('provider_strategy')->nullable();
            $table->unsignedInteger('maximum_results')->default(25);
            $table->string('status', 32)->default('queued');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'id'], 'ds_company_id_uq');
            $table->index(['company_id', 'status', 'created_at'], 'ds_company_status_created_idx');
            $table->index(['company_id', 'purpose', 'created_at'], 'ds_company_purpose_created_idx');
            $table->index(['company_id', 'requested_by_user_id'], 'ds_company_user_idx');
            $table->index(['company_id', 'branch_id'], 'ds_company_branch_idx');
            $table->index(['company_id', 'workspace_id'], 'ds_company_workspace_idx');
        });
    }

    public function down(): void
    {
        // Forward-safe MagicAI lifecycle: package uninstall does not rely on migration rollback.
    }
};
