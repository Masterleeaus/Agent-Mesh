<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('external_place_contacts')) {
            return;
        }

        Schema::create('external_place_contacts', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id', 64)->index('epc_company_idx');
            $table->string('branch_id', 64)->nullable();
            $table->string('workspace_id', 64)->nullable();
            $table->uuid('external_place_id');
            $table->string('contact_type', 32);
            $table->string('normalised_value', 500);
            $table->string('display_value', 500)->nullable();
            $table->string('source_provider', 64)->nullable();
            $table->text('source_url')->nullable();
            $table->string('verification_status', 32)->default('observed');
            $table->string('verification_method', 64)->nullable();
            $table->decimal('confidence', 6, 5)->nullable();
            $table->timestamp('first_observed_at')->nullable();
            $table->timestamp('last_observed_at')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'id'], 'epc_company_id_uq');
            $table->unique(['company_id', 'external_place_id', 'contact_type', 'normalised_value'], 'epc_place_type_value_uq');
            $table->index(['company_id', 'normalised_value'], 'epc_company_value_idx');
            $table->foreign(['company_id', 'external_place_id'], 'epc_place_tenant_fk')
                ->references(['company_id', 'id'])->on('external_places');
        });
    }

    public function down(): void
    {
        // Forward-safe MagicAI lifecycle: package uninstall does not rely on migration rollback.
    }
};
