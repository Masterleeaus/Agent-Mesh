<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('map_locations')) {
            return;
        }

        Schema::create('map_locations', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id', 64)->index('ml_company_idx');
            $table->string('branch_id', 64)->nullable();
            $table->string('workspace_id', 64)->nullable();
            $table->string('reference_type', 48);
            $table->string('public_reference_id', 191);
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 11, 7);
            $table->string('source', 32);
            $table->string('precision', 64)->nullable();
            $table->string('provider', 64)->nullable();
            $table->string('provider_place_id', 255)->nullable();
            $table->string('address_fingerprint', 64)->nullable();
            $table->string('formatted_address', 500)->nullable();
            $table->json('reverse_geocode_metadata')->nullable();
            $table->timestamp('coordinates_verified_at')->nullable();
            $table->timestamp('geocoded_at')->nullable();
            $table->timestamp('reverse_geocoded_at')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'id'], 'ml_company_id_uq');
            $table->unique(['company_id', 'reference_type', 'public_reference_id'], 'ml_company_reference_uq');
            $table->index(['company_id', 'reference_type'], 'ml_company_type_idx');
            $table->index(['company_id', 'branch_id'], 'ml_company_branch_idx');
            $table->index(['company_id', 'workspace_id'], 'ml_company_workspace_idx');
            $table->index(['company_id', 'source'], 'ml_company_source_idx');
            $table->index(['company_id', 'coordinates_verified_at'], 'ml_company_verified_idx');
        });
    }

    public function down(): void
    {
        // Forward-safe MagicAI lifecycle: package uninstall does not rely on migration rollback.
    }
};
