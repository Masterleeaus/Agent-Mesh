<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('maps_service_territories')) return;
        Schema::create('maps_service_territories', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id',64)->index('mst_company_idx');
            $table->string('branch_id',64)->nullable();
            $table->string('workspace_id',64)->nullable();
            $table->string('name',191);
            $table->text('description')->nullable();
            $table->string('effect',24)->default('include');
            $table->string('match_mode',32);
            $table->integer('priority')->default(0);
            $table->string('status',24)->default('active');
            $table->string('branch_public_id',191)->nullable();
            $table->json('service_keys')->nullable();
            $table->decimal('center_latitude',10,7)->nullable();
            $table->decimal('center_longitude',10,7)->nullable();
            $table->decimal('radius_metres',12,2)->nullable();
            $table->json('geometry')->nullable();
            $table->json('locality_values')->nullable();
            $table->unsignedInteger('maximum_road_distance_metres')->nullable();
            $table->unsignedInteger('maximum_drive_time_seconds')->nullable();
            $table->json('pricing_hint')->nullable();
            $table->timestamp('effective_from')->nullable();
            $table->timestamp('effective_until')->nullable();
            $table->string('created_by_user_id',191)->nullable();
            $table->string('updated_by_user_id',191)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(['company_id','id'],'mst_company_id_uq');
            $table->index(['company_id','status','effect','priority'],'mst_active_effect_idx');
            $table->index(['company_id','branch_public_id','status'],'mst_branch_status_idx');
            $table->index(['company_id','match_mode','status'],'mst_mode_status_idx');
        });
    }
    public function down(): void { /* Forward-safe: territory definitions are retained. */ }
};
