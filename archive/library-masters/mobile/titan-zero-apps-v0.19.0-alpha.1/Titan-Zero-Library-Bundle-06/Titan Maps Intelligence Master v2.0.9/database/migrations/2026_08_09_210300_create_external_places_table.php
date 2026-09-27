<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('external_places')) {
            return;
        }

        Schema::create('external_places', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id', 64)->index('ep_company_idx');
            $table->string('branch_id', 64)->nullable();
            $table->string('workspace_id', 64)->nullable();
            $table->string('provider', 64);
            $table->string('provider_place_id', 255);
            $table->string('canonical_key', 255);
            $table->string('name', 500);
            $table->string('legal_name', 500)->nullable();
            $table->text('description')->nullable();
            $table->json('categories')->nullable();
            $table->string('primary_category', 128)->nullable();
            $table->string('address', 500)->nullable();
            $table->string('suburb', 191)->nullable();
            $table->string('state', 128)->nullable();
            $table->string('postcode', 32)->nullable();
            $table->string('country', 8)->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 11, 7)->nullable();
            $table->string('phone', 64)->nullable();
            $table->string('website', 1000)->nullable();
            $table->string('public_email', 320)->nullable();
            $table->json('opening_hours')->nullable();
            $table->boolean('currently_open')->nullable();
            $table->boolean('temporarily_closed')->default(false);
            $table->boolean('permanently_closed')->default(false);
            $table->decimal('rating', 3, 2)->nullable();
            $table->unsignedInteger('review_count')->nullable();
            $table->string('price_level', 32)->nullable();
            $table->text('source_url')->nullable();
            $table->string('raw_payload_reference', 500)->nullable();
            $table->string('raw_payload_hash', 128)->nullable();
            $table->timestamp('first_observed_at')->nullable();
            $table->timestamp('last_observed_at')->nullable();
            $table->timestamp('last_verified_at')->nullable();
            $table->decimal('confidence', 6, 5)->nullable();
            $table->string('data_freshness', 64)->nullable();
            $table->json('provider_terms_metadata')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'id'], 'ep_company_id_uq');
            $table->unique(['company_id', 'provider', 'provider_place_id'], 'ep_company_provider_place_uq');
            $table->index(['company_id', 'canonical_key'], 'ep_company_canonical_idx');
            $table->index(['company_id', 'primary_category'], 'ep_company_category_idx');
            $table->index(['company_id', 'postcode'], 'ep_company_postcode_idx');
            $table->index(['company_id', 'last_verified_at'], 'ep_company_verified_idx');
            $table->index(['company_id', 'branch_id'], 'ep_company_branch_idx');
            $table->index(['company_id', 'workspace_id'], 'ep_company_workspace_idx');
        });
    }

    public function down(): void
    {
        // Forward-safe MagicAI lifecycle: package uninstall does not rely on migration rollback.
    }
};
