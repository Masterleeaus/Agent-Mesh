<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('maps_suppressions')) {
            return;
        }

        Schema::create('maps_suppressions', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id', 64)->index('ms_company_idx');
            $table->string('branch_id', 64)->nullable();
            $table->string('workspace_id', 64)->nullable();
            $table->string('suppression_type', 64);
            $table->string('normalised_value', 500);
            $table->text('reason')->nullable();
            $table->string('created_by_user_id', 64)->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'id'], 'ms_company_id_uq');
            $table->unique(['company_id', 'suppression_type', 'normalised_value'], 'ms_type_value_uq');
            $table->index(['company_id', 'expires_at'], 'ms_company_expires_idx');
            $table->index(['company_id', 'branch_id'], 'ms_company_branch_idx');
        });
    }

    public function down(): void
    {
        // Forward-safe MagicAI lifecycle: package uninstall does not rely on migration rollback.
    }
};
