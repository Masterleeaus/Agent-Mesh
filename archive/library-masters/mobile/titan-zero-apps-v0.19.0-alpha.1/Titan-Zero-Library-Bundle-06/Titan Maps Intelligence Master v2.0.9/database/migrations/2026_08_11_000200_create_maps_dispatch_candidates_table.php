<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('maps_dispatch_candidates')) return;
        Schema::create('maps_dispatch_candidates', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id',64)->index('mdc_company_idx');
            $table->uuid('dispatch_recommendation_id');
            $table->string('worker_public_id',191);
            $table->string('worker_user_id',191)->nullable();
            $table->unsignedInteger('rank')->nullable();
            $table->boolean('eligible')->default(true);
            $table->boolean('blocked')->default(false);
            $table->decimal('total_score',5,2)->default(0);
            $table->decimal('latitude',10,7)->nullable();
            $table->decimal('longitude',10,7)->nullable();
            $table->unsignedInteger('road_distance_metres')->nullable();
            $table->unsignedInteger('straight_line_distance_metres')->nullable();
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->unsignedInteger('traffic_delay_seconds')->nullable();
            $table->string('eta_basis',40)->default('unavailable');
            $table->string('matrix_condition',40)->nullable();
            $table->json('dimensions');
            $table->json('evidence');
            $table->json('blockers')->nullable();
            $table->json('explanations')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(['company_id','id'],'mdc_company_id_uq');
            $table->unique(['company_id','dispatch_recommendation_id','worker_public_id'],'mdc_rec_worker_uq');
            $table->index(['company_id','dispatch_recommendation_id','rank'],'mdc_rec_rank_idx');
            $table->foreign(['company_id','dispatch_recommendation_id'],'mdc_rec_tenant_fk')->references(['company_id','id'])->on('maps_dispatch_recommendations')->cascadeOnUpdate()->restrictOnDelete();
        });
    }
    public function down(): void { /* Forward-safe: candidate score evidence is retained. */ }
};
