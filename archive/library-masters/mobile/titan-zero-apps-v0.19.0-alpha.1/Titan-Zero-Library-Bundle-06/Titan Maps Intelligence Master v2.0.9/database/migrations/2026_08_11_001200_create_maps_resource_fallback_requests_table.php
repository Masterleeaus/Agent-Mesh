<?php

declare(strict_types=1);
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('maps_resource_fallback_requests')) return;
        Schema::create('maps_resource_fallback_requests', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id',64)->index('mrfr_company_idx');
            $table->string('branch_id',64)->nullable();
            $table->string('workspace_id',64)->nullable();
            $table->string('resource_type',32);
            $table->string('operational_need_type',40)->default('manual');
            $table->string('operational_need_public_id',191)->nullable();
            $table->string('job_public_id',191)->nullable();
            $table->string('service_key',191)->nullable();
            $table->string('query',255)->nullable();
            $table->decimal('target_latitude',10,7);
            $table->decimal('target_longitude',10,7);
            $table->decimal('radius_metres',12,2)->default(25000);
            $table->string('travel_mode',24)->default('DRIVE');
            $table->string('routing_preference',40)->default('TRAFFIC_AWARE');
            $table->boolean('open_now')->default(false);
            $table->string('status',40)->default('new')->index('mrfr_status_idx');
            $table->string('internal_check_status',40)->default('not_applicable');
            $table->json('internal_evidence')->nullable();
            $table->string('approved_network_status',40)->default('pending');
            $table->json('approved_network_evidence')->nullable();
            $table->uuid('discovery_search_id')->nullable();
            $table->uuid('selected_candidate_id')->nullable();
            $table->string('requested_by_user_id',191)->nullable();
            $table->timestamp('refreshed_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(['company_id','id'],'mrfr_company_id_uq');
            $table->index(['company_id','resource_type','status'],'mrfr_type_status_idx');
            $table->index(['company_id','job_public_id','created_at'],'mrfr_job_time_idx');
            $table->index(['company_id','operational_need_type','operational_need_public_id'],'mrfr_need_idx');
            $table->foreign(['company_id','discovery_search_id'],'mrfr_search_tenant_fk')->references(['company_id','id'])->on('discovery_searches');
        });
    }
    public function down(): void { /* Forward-safe: fallback sourcing evidence is retained. */ }
};
