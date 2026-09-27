<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('maps_worker_tracking_states')) {
            return;
        }

        Schema::create('maps_worker_tracking_states', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id', 64)->index('mwts_company_idx');
            $table->string('branch_id', 64)->nullable();
            $table->string('workspace_id', 64)->nullable();
            $table->string('worker_public_id', 191);
            $table->string('user_id', 191);
            $table->boolean('tracking_allowed')->default(false);
            $table->boolean('on_duty')->default(false);
            $table->uuid('latest_location_ping_id')->nullable();
            $table->timestamp('latest_captured_at')->nullable();
            $table->timestamp('last_received_at')->nullable();
            $table->timestamp('status_changed_at')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'id'], 'mwts_company_id_uq');
            $table->unique(['company_id', 'worker_public_id'], 'mwts_company_worker_uq');
            $table->unique(['company_id', 'user_id'], 'mwts_company_user_uq');
            $table->index(['company_id', 'on_duty', 'tracking_allowed'], 'mwts_company_state_idx');
            $table->index(['company_id', 'latest_captured_at'], 'mwts_company_capture_idx');
        });
    }

    public function down(): void
    {
        // Forward-safe MagicAI lifecycle: worker tracking consent/duty state is retained on uninstall.
    }
};
