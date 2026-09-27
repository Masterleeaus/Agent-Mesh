<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('candidate_promotions')) {
            return;
        }

        Schema::create('candidate_promotions', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id', 64)->index('cp_company_idx');
            $table->string('branch_id', 64)->nullable();
            $table->string('workspace_id', 64)->nullable();
            $table->uuid('candidate_id');
            $table->string('target_workcore_service', 128)->nullable();
            $table->string('target_entity_type', 64);
            $table->string('target_entity_id', 191)->nullable();
            $table->string('requested_by_user_id', 64)->nullable();
            $table->string('approved_by_user_id', 64)->nullable();
            $table->string('agent_id', 64)->nullable();
            $table->string('conversation_id', 191)->nullable();
            $table->json('accepted_fields');
            $table->json('rejected_fields')->nullable();
            $table->text('reason')->nullable();
            $table->string('workcore_command_id', 191)->nullable();
            $table->string('workcore_event_id', 191)->nullable();
            $table->timestamp('promoted_at')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'id'], 'cp_company_id_uq');
            $table->index(['company_id', 'candidate_id', 'promoted_at'], 'cp_candidate_promoted_idx');
            $table->index(['company_id', 'target_entity_type', 'target_entity_id'], 'cp_target_entity_idx');
            $table->index(['company_id', 'requested_by_user_id'], 'cp_company_requester_idx');
            $table->foreign(['company_id', 'candidate_id'], 'cp_candidate_tenant_fk')
                ->references(['company_id', 'id'])->on('discovery_candidates');
        });
    }

    public function down(): void
    {
        // Forward-safe MagicAI lifecycle: package uninstall does not rely on migration rollback.
    }
};
