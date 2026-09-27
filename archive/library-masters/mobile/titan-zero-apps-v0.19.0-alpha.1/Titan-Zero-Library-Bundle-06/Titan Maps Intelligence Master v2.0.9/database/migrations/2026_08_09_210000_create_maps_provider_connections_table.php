<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('maps_provider_connections')) {
            return;
        }

        Schema::create('maps_provider_connections', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id', 64)->index('mpc_company_idx');
            $table->string('branch_id', 64)->nullable();
            $table->string('workspace_id', 64)->nullable();
            $table->string('provider', 64);
            $table->string('credential_reference', 255);
            $table->boolean('enabled')->default(true);
            $table->unsignedSmallInteger('priority')->default(100);
            $table->json('configuration')->nullable();
            $table->json('capabilities')->nullable();
            $table->string('terms_version', 64)->nullable();
            $table->timestamp('last_validated_at')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'provider'], 'mpc_company_provider_uq');
            $table->index(['company_id', 'enabled', 'priority'], 'mpc_company_enabled_priority_idx');
            $table->index(['company_id', 'branch_id'], 'mpc_company_branch_idx');
            $table->index(['company_id', 'workspace_id'], 'mpc_company_workspace_idx');
        });
    }

    public function down(): void
    {
        // Forward-safe MagicAI lifecycle: package uninstall does not rely on migration rollback.
    }
};
