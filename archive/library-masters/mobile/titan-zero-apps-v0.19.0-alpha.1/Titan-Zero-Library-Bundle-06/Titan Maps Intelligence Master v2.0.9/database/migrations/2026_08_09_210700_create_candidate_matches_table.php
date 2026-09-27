<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('candidate_matches')) {
            return;
        }

        Schema::create('candidate_matches', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id', 64)->index('cm_company_idx');
            $table->string('branch_id', 64)->nullable();
            $table->string('workspace_id', 64)->nullable();
            $table->uuid('candidate_id');
            $table->string('workcore_entity_type', 64);
            $table->string('workcore_entity_id', 191);
            $table->decimal('match_score', 6, 5)->default(0);
            $table->json('matching_fields')->nullable();
            $table->json('conflicting_fields')->nullable();
            $table->string('match_strategy', 64)->default('deterministic_weighted');
            $table->string('human_review_status', 32)->default('pending');
            $table->text('resolution')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'id'], 'cm_company_id_uq');
            $table->index(['company_id', 'candidate_id', 'match_score'], 'cm_candidate_score_idx');
            $table->index(['company_id', 'workcore_entity_type', 'workcore_entity_id'], 'cm_workcore_entity_idx');
            $table->index(['company_id', 'human_review_status'], 'cm_review_idx');
            $table->foreign(['company_id', 'candidate_id'], 'cm_candidate_tenant_fk')
                ->references(['company_id', 'id'])->on('discovery_candidates');
        });
    }

    public function down(): void
    {
        // Forward-safe MagicAI lifecycle: package uninstall does not rely on migration rollback.
    }
};
