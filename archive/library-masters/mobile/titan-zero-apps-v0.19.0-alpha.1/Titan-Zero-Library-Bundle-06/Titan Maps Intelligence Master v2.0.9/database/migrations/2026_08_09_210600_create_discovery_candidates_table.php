<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('discovery_candidates')) {
            return;
        }

        Schema::create('discovery_candidates', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id', 64)->index('dc_company_idx');
            $table->string('branch_id', 64)->nullable();
            $table->string('workspace_id', 64)->nullable();
            $table->uuid('discovery_search_id');
            $table->uuid('external_place_id');
            $table->string('candidate_type', 64);
            $table->string('lifecycle_status', 32)->default('new');
            $table->decimal('relevance_score', 6, 5)->nullable();
            $table->decimal('confidence_score', 6, 5)->nullable();
            $table->json('classification_evidence')->nullable();
            $table->string('assigned_user_id', 64)->nullable();
            $table->string('assigned_agent_id', 64)->nullable();
            $table->string('existing_workcore_entity_type', 64)->nullable();
            $table->string('existing_workcore_entity_id', 191)->nullable();
            $table->string('review_status', 32)->default('pending');
            $table->boolean('unresolved_match')->default(false);
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'id'], 'dc_company_id_uq');
            $table->unique(['company_id', 'discovery_search_id', 'external_place_id', 'candidate_type'], 'dc_search_place_type_uq');
            $table->index(['company_id', 'discovery_search_id', 'review_status'], 'dc_search_review_idx');
            $table->index(['company_id', 'candidate_type', 'review_status'], 'dc_type_review_idx');
            $table->index(['company_id', 'assigned_user_id'], 'dc_company_assignee_idx');
            $table->foreign(['company_id', 'discovery_search_id'], 'dc_search_tenant_fk')
                ->references(['company_id', 'id'])->on('discovery_searches');
            $table->foreign(['company_id', 'external_place_id'], 'dc_place_tenant_fk')
                ->references(['company_id', 'id'])->on('external_places');
        });
    }

    public function down(): void
    {
        // Forward-safe MagicAI lifecycle: package uninstall does not rely on migration rollback.
    }
};
