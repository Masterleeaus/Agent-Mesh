<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('maps_dispatch_recommendations')) return;
        Schema::create('maps_dispatch_recommendations', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id',64)->index('mdr_company_idx');
            $table->string('branch_id',64)->nullable();
            $table->string('workspace_id',64)->nullable();
            $table->string('job_public_id',191);
            $table->string('job_type',40)->default('work_order');
            $table->string('job_title',191)->nullable();
            $table->string('priority',30)->default('normal');
            $table->decimal('target_latitude',10,7);
            $table->decimal('target_longitude',10,7);
            $table->timestamp('scheduled_start')->nullable();
            $table->timestamp('scheduled_end')->nullable();
            $table->string('travel_mode',24)->default('DRIVE');
            $table->string('routing_preference',40)->default('TRAFFIC_AWARE');
            $table->uuid('matrix_snapshot_id')->nullable();
            $table->string('status',40)->default('pending_approval')->index('mdr_status_idx');
            $table->string('recommended_worker_public_id',191)->nullable();
            $table->string('recommended_worker_user_id',191)->nullable();
            $table->string('selected_worker_public_id',191)->nullable();
            $table->string('selected_worker_user_id',191)->nullable();
            $table->string('scoring_version',40);
            $table->json('weights');
            $table->json('job_snapshot');
            $table->json('summary')->nullable();
            $table->string('requested_by_user_id',191)->nullable();
            $table->dateTime('calculated_at');
            $table->timestamp('expires_at')->nullable()->index('mdr_expires_idx');
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(['company_id','id'],'mdr_company_id_uq');
            $table->index(['company_id','job_public_id','calculated_at'],'mdr_job_time_idx');
            $table->index(['company_id','recommended_worker_public_id','calculated_at'],'mdr_worker_time_idx');
        });
    }
    public function down(): void { /* Forward-safe: dispatch recommendation evidence is retained. */ }
};
