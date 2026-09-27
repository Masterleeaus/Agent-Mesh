<?php

declare(strict_types=1);
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('maps_resource_fallback_candidates')) return;
        Schema::create('maps_resource_fallback_candidates', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id',64)->index('mrfc_company_idx');
            $table->uuid('fallback_request_id');
            $table->string('source',32);
            $table->string('resource_type',32);
            $table->string('source_reference_type',64)->nullable();
            $table->string('source_public_id',191)->nullable();
            $table->uuid('discovery_candidate_id')->nullable();
            $table->string('label',191);
            $table->string('subtitle',255)->nullable();
            $table->decimal('latitude',10,7)->nullable();
            $table->decimal('longitude',10,7)->nullable();
            $table->decimal('service_match',6,5)->nullable();
            $table->string('service_evidence',32)->default('unknown');
            $table->unsignedInteger('road_distance_metres')->nullable();
            $table->unsignedInteger('straight_line_distance_metres')->nullable();
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->unsignedInteger('traffic_delay_seconds')->nullable();
            $table->string('eta_basis',32)->default('unavailable');
            $table->string('matrix_condition',32)->nullable();
            $table->decimal('fit_score',6,2)->default(0);
            $table->unsignedSmallInteger('rank')->default(1);
            $table->string('status',32)->default('proposed')->index('mrfc_status_idx');
            $table->json('evidence')->nullable();
            $table->json('explanations')->nullable();
            $table->string('reviewed_by_user_id',191)->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('promoted_at')->nullable();
            $table->string('promotion_target_entity_id',191)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(['company_id','id'],'mrfc_company_id_uq');
            $table->unique(['company_id','fallback_request_id','source','source_public_id'],'mrfc_req_source_uq');
            $table->index(['company_id','fallback_request_id','rank'],'mrfc_req_rank_idx');
            $table->foreign(['company_id','fallback_request_id'],'mrfc_req_tenant_fk')->references(['company_id','id'])->on('maps_resource_fallback_requests');
            $table->foreign(['company_id','discovery_candidate_id'],'mrfc_disc_tenant_fk')->references(['company_id','id'])->on('discovery_candidates');
        });
    }
    public function down(): void { /* Forward-safe: fallback candidate evidence is retained. */ }
};
