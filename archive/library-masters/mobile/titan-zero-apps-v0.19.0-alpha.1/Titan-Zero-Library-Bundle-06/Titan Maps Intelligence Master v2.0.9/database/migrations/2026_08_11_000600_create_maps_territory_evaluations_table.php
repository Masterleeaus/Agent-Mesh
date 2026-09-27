<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('maps_territory_evaluations')) return;
        Schema::create('maps_territory_evaluations', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id',64)->index('mte_company_idx');
            $table->string('branch_id',64)->nullable();
            $table->string('workspace_id',64)->nullable();
            $table->string('target_reference_type',40)->nullable();
            $table->string('target_public_reference_id',191)->nullable();
            $table->decimal('target_latitude',10,7)->nullable();
            $table->decimal('target_longitude',10,7)->nullable();
            $table->string('target_suburb',120)->nullable();
            $table->string('target_postcode',24)->nullable();
            $table->string('service_key',120)->nullable();
            $table->boolean('covered')->default(false);
            $table->uuid('primary_territory_id')->nullable();
            $table->uuid('blocked_territory_id')->nullable();
            $table->uuid('travel_territory_id')->nullable();
            $table->string('branch_public_id',191)->nullable();
            $table->uuid('route_snapshot_id')->nullable();
            $table->string('result_basis',40)->default('geographic_rules');
            $table->unsignedInteger('road_distance_metres')->nullable();
            $table->unsignedInteger('straight_line_distance_metres')->nullable();
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->string('distance_basis',40)->nullable();
            $table->string('eta_basis',40)->nullable();
            $table->json('matched_territories')->nullable();
            $table->json('evidence')->nullable();
            $table->string('evaluated_by_user_id',191)->nullable();
            $table->dateTime('evaluated_at');
            $table->timestamps();
            $table->unique(['company_id','id'],'mte_company_id_uq');
            $table->index(['company_id','covered','evaluated_at'],'mte_covered_time_idx');
            $table->index(['company_id','target_reference_type','target_public_reference_id'],'mte_target_idx');
            $table->index(['company_id','branch_public_id','evaluated_at'],'mte_branch_time_idx');
        });
    }
    public function down(): void { /* Forward-safe: evaluation evidence is retained. */ }
};
