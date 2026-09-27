<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('maps_location_pings')) {
            return;
        }

        Schema::create('maps_location_pings', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id', 64)->index('mlp_company_idx');
            $table->string('branch_id', 64)->nullable();
            $table->string('workspace_id', 64)->nullable();
            $table->string('worker_public_id', 191);
            $table->string('user_id', 191);
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 11, 7);
            $table->decimal('accuracy_metres', 10, 2);
            $table->decimal('altitude_metres', 10, 2)->nullable();
            $table->decimal('speed_metres_per_second', 8, 3)->nullable();
            $table->decimal('heading_degrees', 7, 3)->nullable();
            $table->json('motion_metadata')->nullable();
            $table->dateTime('captured_at');
            $table->dateTime('received_at');
            $table->string('dedupe_key', 64);
            $table->timestamps();

            $table->unique(['company_id', 'id'], 'mlp_company_id_uq');
            $table->unique(['company_id', 'dedupe_key'], 'mlp_company_dedupe_uq');
            $table->index(['company_id', 'worker_public_id', 'captured_at'], 'mlp_worker_time_idx');
            $table->index(['company_id', 'user_id', 'captured_at'], 'mlp_user_time_idx');
            $table->index(['company_id', 'captured_at'], 'mlp_company_time_idx');
            $table->index(['company_id', 'branch_id', 'captured_at'], 'mlp_branch_time_idx');
        });
    }

    public function down(): void
    {
        // Forward-safe MagicAI lifecycle: location history is retained on extension uninstall.
    }
};
