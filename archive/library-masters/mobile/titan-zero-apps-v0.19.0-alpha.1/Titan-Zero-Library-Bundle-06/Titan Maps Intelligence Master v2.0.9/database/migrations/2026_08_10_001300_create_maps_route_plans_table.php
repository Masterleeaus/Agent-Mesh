<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('maps_route_plans')) return;
        Schema::create('maps_route_plans', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id',64)->index('mrp_company_idx');
            $table->string('branch_id',64)->nullable();
            $table->string('workspace_id',64)->nullable();
            $table->string('name',191);
            $table->date('service_date')->nullable();
            $table->string('worker_public_id',191)->nullable();
            $table->string('travel_mode',24)->default('DRIVE');
            $table->string('routing_preference',32)->default('TRAFFIC_AWARE');
            $table->timestamp('start_at')->nullable();
            $table->string('status',24)->default('active');
            $table->uuid('current_run_id')->nullable();
            $table->string('created_by_user_id',191)->nullable();
            $table->string('updated_by_user_id',191)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(['company_id','id'],'mrp_company_id_uq');
            $table->index(['company_id','service_date','status'],'mrp_date_status_idx');
            $table->index(['company_id','worker_public_id','service_date'],'mrp_worker_date_idx');
        });
    }

    public function down(): void { /* Forward-safe: route plans are operational audit data and are retained. */ }
};
