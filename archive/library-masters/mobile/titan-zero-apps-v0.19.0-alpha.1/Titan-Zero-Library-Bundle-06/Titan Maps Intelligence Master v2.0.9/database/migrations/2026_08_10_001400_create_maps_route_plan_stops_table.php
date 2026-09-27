<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('maps_route_plan_stops')) return;
        Schema::create('maps_route_plan_stops', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id',64)->index('mrps_company_idx');
            $table->uuid('route_plan_id');
            $table->unsignedSmallInteger('sequence');
            $table->unsignedSmallInteger('original_sequence');
            $table->string('stop_type',24);
            $table->string('label',191);
            $table->string('reference_type',32)->nullable();
            $table->string('public_reference_id',191)->nullable();
            $table->decimal('latitude',10,7);
            $table->decimal('longitude',11,7);
            $table->unsignedInteger('service_duration_seconds')->default(0);
            $table->timestamp('window_start')->nullable();
            $table->timestamp('window_end')->nullable();
            $table->boolean('locked')->default(false);
            $table->string('status',24)->default('planned');
            $table->timestamp('completed_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(['company_id','id'],'mrps_company_id_uq');
            $table->index(['company_id','route_plan_id','sequence'],'mrps_plan_seq_idx');
            $table->index(['company_id','reference_type','public_reference_id'],'mrps_reference_idx');
            $table->foreign(['company_id','route_plan_id'],'mrps_plan_fk')->references(['company_id','id'])->on('maps_route_plans');
        });
    }

    public function down(): void { /* Forward-safe: planned-stop history is retained. */ }
};
