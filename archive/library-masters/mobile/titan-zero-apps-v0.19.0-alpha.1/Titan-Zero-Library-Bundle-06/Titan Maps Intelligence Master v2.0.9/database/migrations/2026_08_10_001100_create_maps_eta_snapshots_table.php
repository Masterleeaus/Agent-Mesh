<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('maps_eta_snapshots')) return;
        Schema::create('maps_eta_snapshots', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id', 64)->index('mes_company_idx');
            $table->uuid('route_snapshot_id');
            $table->string('provider', 64)->nullable();
            $table->string('result_basis', 32);
            $table->string('traffic_basis', 32);
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->unsignedInteger('static_duration_seconds')->nullable();
            $table->unsignedInteger('traffic_delay_seconds')->nullable();
            $table->dateTime('calculated_at');
            $table->timestamp('stale_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(['company_id','id'], 'mes_company_id_uq');
            $table->unique(['company_id','route_snapshot_id'], 'mes_route_company_uq');
            $table->index(['company_id','traffic_basis','calculated_at'], 'mes_traffic_time_idx');
            $table->foreign(['company_id','route_snapshot_id'], 'mes_route_tenant_fk')
                ->references(['company_id','id'])->on('maps_route_snapshots')->cascadeOnUpdate()->restrictOnDelete();
        });
    }

    public function down(): void { /* Forward-safe: ETA provenance/history is retained on uninstall. */ }
};
