<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('maps_geofence_events')) return;
        Schema::create('maps_geofence_events', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id', 64)->index('mge_company_idx');
            $table->string('branch_id', 64)->nullable();
            $table->string('workspace_id', 64)->nullable();
            $table->uuid('geofence_id');
            $table->string('worker_public_id', 191);
            $table->uuid('location_ping_id')->nullable();
            $table->string('event_type', 32);
            $table->string('reference_type', 32)->nullable();
            $table->string('public_reference_id', 191)->nullable();
            $table->boolean('requires_confirmation')->default(false);
            $table->string('confirmation_status', 16)->default('none');
            $table->string('confirmed_by_user_id', 191)->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->dateTime('occurred_at');
            $table->string('idempotency_key', 64);
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(['company_id','id'], 'mge_company_id_uq');
            $table->unique(['company_id','idempotency_key'], 'mge_company_idem_uq');
            $table->index(['company_id','geofence_id','occurred_at'], 'mge_geofence_time_idx');
            $table->index(['company_id','worker_public_id','occurred_at'], 'mge_worker_time_idx');
            $table->index(['company_id','confirmation_status','occurred_at'], 'mge_confirm_time_idx');
        });
    }
    public function down(): void { /* Forward-safe: geofence event history is retained on uninstall. */ }
};
