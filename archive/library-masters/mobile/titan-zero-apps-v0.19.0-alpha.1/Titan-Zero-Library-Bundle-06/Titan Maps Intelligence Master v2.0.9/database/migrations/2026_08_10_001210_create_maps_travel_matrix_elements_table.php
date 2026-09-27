<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('maps_travel_matrix_elements')) return;
        Schema::create('maps_travel_matrix_elements', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id',64)->index('mtme_company_idx');
            $table->uuid('matrix_snapshot_id');
            $table->unsignedSmallInteger('origin_index');
            $table->unsignedSmallInteger('destination_index');
            $table->string('origin_reference_type',32)->nullable();
            $table->string('origin_public_reference_id',191)->nullable();
            $table->string('destination_reference_type',32)->nullable();
            $table->string('destination_public_reference_id',191)->nullable();
            $table->decimal('origin_latitude',10,7);
            $table->decimal('origin_longitude',11,7);
            $table->decimal('destination_latitude',10,7);
            $table->decimal('destination_longitude',11,7);
            $table->unsignedInteger('distance_metres')->nullable();
            $table->unsignedInteger('straight_line_distance_metres');
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->unsignedInteger('static_duration_seconds')->nullable();
            $table->unsignedInteger('traffic_delay_seconds')->nullable();
            $table->string('condition',48);
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(['company_id','matrix_snapshot_id','origin_index','destination_index'],'mtme_cell_uq');
            $table->index(['company_id','matrix_snapshot_id','duration_seconds'],'mtme_eta_idx');
            $table->foreign(['company_id','matrix_snapshot_id'],'mtme_snapshot_fk')->references(['company_id','id'])->on('maps_travel_matrix_snapshots');
        });
    }

    public function down(): void { /* Forward-safe: matrix comparison provenance is retained on uninstall. */ }
};
