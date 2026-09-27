<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('field_observations')) {
            return;
        }

        Schema::create('field_observations', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id', 64)->index('fo_company_idx');
            $table->string('branch_id', 64)->nullable();
            $table->string('workspace_id', 64)->nullable();
            $table->uuid('external_place_id');
            $table->string('field', 128);
            $table->json('observed_value');
            $table->string('provider', 64);
            $table->text('source_url')->nullable();
            $table->dateTime('observed_at');
            $table->decimal('confidence', 6, 5)->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->json('restrictions')->nullable();
            $table->string('observation_type', 64)->default('provider_observation');
            $table->timestamps();

            $table->unique(['company_id', 'id'], 'fo_company_id_uq');
            $table->index(['company_id', 'external_place_id', 'field', 'observed_at'], 'fo_place_field_observed_idx');
            $table->index(['company_id', 'expires_at'], 'fo_company_expires_idx');
            $table->foreign(['company_id', 'external_place_id'], 'fo_place_tenant_fk')
                ->references(['company_id', 'id'])->on('external_places');
        });
    }

    public function down(): void
    {
        // Forward-safe MagicAI lifecycle: package uninstall does not rely on migration rollback.
    }
};
