<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('maps_route_plan_runs')) return;
        Schema::create('maps_route_plan_runs', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id',64)->index('mrpr_company_idx');
            $table->uuid('route_plan_id');
            $table->unsignedInteger('revision');
            $table->string('trigger',32);
            $table->uuid('matrix_snapshot_id')->nullable();
            $table->string('result_basis',32);
            $table->string('provider',64)->nullable();
            $table->string('algorithm',64);
            $table->unsignedInteger('baseline_distance_metres')->nullable();
            $table->unsignedInteger('optimised_distance_metres')->nullable();
            $table->unsignedInteger('distance_savings_metres')->nullable();
            $table->unsignedInteger('baseline_duration_seconds')->nullable();
            $table->unsignedInteger('optimised_duration_seconds')->nullable();
            $table->unsignedInteger('duration_savings_seconds')->nullable();
            $table->json('ordered_stop_ids');
            $table->json('schedule')->nullable();
            $table->json('window_violations')->nullable();
            $table->json('route_snapshot_ids')->nullable();
            $table->string('geometry_status',48)->default('sequence_connectors');
            $table->json('metadata')->nullable();
            $table->dateTime('calculated_at');
            $table->string('created_by_user_id',191)->nullable();
            $table->timestamps();
            $table->unique(['company_id','id'],'mrpr_company_id_uq');
            $table->unique(['company_id','route_plan_id','revision'],'mrpr_plan_revision_uq');
            $table->index(['company_id','route_plan_id','calculated_at'],'mrpr_plan_time_idx');
            $table->foreign(['company_id','route_plan_id'],'mrpr_plan_fk')->references(['company_id','id'])->on('maps_route_plans');
            $table->foreign(['company_id','matrix_snapshot_id'],'mrpr_matrix_fk')->references(['company_id','id'])->on('maps_travel_matrix_snapshots');
        });
    }

    public function down(): void { /* Forward-safe: optimisation provenance is retained. */ }
};
