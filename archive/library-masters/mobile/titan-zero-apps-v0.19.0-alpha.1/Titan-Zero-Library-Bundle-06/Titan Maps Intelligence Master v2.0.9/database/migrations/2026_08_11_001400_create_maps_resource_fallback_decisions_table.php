<?php

declare(strict_types=1);
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('maps_resource_fallback_decisions')) return;
        Schema::create('maps_resource_fallback_decisions', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id',64)->index('mrfd_company_idx');
            $table->uuid('fallback_request_id');
            $table->uuid('fallback_candidate_id');
            $table->string('decision',32);
            $table->boolean('promote_requested')->default(false);
            $table->text('reason')->nullable();
            $table->string('decided_by_user_id',191);
            $table->dateTime('decided_at');
            $table->json('result')->nullable();
            $table->timestamps();
            $table->unique(['company_id','id'],'mrfd_company_id_uq');
            $table->index(['company_id','fallback_request_id','decided_at'],'mrfd_req_time_idx');
            $table->foreign(['company_id','fallback_request_id'],'mrfd_req_tenant_fk')->references(['company_id','id'])->on('maps_resource_fallback_requests');
            $table->foreign(['company_id','fallback_candidate_id'],'mrfd_cand_tenant_fk')->references(['company_id','id'])->on('maps_resource_fallback_candidates');
        });
    }
    public function down(): void { /* Forward-safe: human fallback decisions are retained. */ }
};
