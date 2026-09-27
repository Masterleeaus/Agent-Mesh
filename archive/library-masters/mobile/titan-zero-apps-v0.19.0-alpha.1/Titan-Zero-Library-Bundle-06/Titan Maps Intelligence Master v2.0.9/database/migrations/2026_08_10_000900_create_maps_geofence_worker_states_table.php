<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('maps_geofence_worker_states')) return;
        Schema::create('maps_geofence_worker_states', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id', 64)->index('mgws_company_idx');
            $table->string('branch_id', 64)->nullable();
            $table->string('workspace_id', 64)->nullable();
            $table->uuid('geofence_id');
            $table->string('worker_public_id', 191);
            $table->boolean('is_inside')->default(false);
            $table->string('candidate_state', 16)->nullable();
            $table->unsignedSmallInteger('candidate_samples')->default(0);
            $table->timestamp('candidate_started_at')->nullable();
            $table->timestamp('entered_at')->nullable();
            $table->timestamp('last_evaluated_at')->nullable();
            $table->timestamp('last_dwell_event_at')->nullable();
            $table->uuid('last_location_ping_id')->nullable();
            $table->timestamps();
            $table->unique(['company_id','id'], 'mgws_company_id_uq');
            $table->unique(['company_id','geofence_id','worker_public_id'], 'mgws_fence_worker_uq');
            $table->index(['company_id','worker_public_id','is_inside'], 'mgws_worker_inside_idx');
        });
    }
    public function down(): void { /* Forward-safe: evaluation state is retained on uninstall. */ }
};
