<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('maps_dispatch_decisions')) return;
        Schema::create('maps_dispatch_decisions', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id',64)->index('mdd_company_idx');
            $table->uuid('dispatch_recommendation_id');
            $table->uuid('dispatch_candidate_id')->nullable();
            $table->string('decision',20);
            $table->string('worker_public_id',191)->nullable();
            $table->string('worker_user_id',191)->nullable();
            $table->boolean('assignment_requested')->default(false);
            $table->string('assignment_status',40)->default('not_requested');
            $table->string('assignment_reference',191)->nullable();
            $table->text('reason')->nullable();
            $table->string('decided_by_user_id',191)->nullable();
            $table->dateTime('decided_at');
            $table->json('result')->nullable();
            $table->timestamps();
            $table->unique(['company_id','id'],'mdd_company_id_uq');
            $table->index(['company_id','dispatch_recommendation_id','decided_at'],'mdd_rec_time_idx');
            $table->foreign(['company_id','dispatch_recommendation_id'],'mdd_rec_tenant_fk')->references(['company_id','id'])->on('maps_dispatch_recommendations')->cascadeOnUpdate()->restrictOnDelete();
        });
    }
    public function down(): void { /* Forward-safe: human dispatch decisions are audit evidence. */ }
};
