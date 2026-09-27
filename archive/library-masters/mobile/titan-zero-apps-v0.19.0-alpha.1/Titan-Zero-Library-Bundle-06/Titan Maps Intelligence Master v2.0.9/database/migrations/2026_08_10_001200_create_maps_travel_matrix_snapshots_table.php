<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('maps_travel_matrix_snapshots')) return;
        Schema::create('maps_travel_matrix_snapshots', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id',64)->index('mtms_company_idx');
            $table->string('branch_id',64)->nullable();
            $table->string('workspace_id',64)->nullable();
            $table->string('request_signature',64);
            $table->string('travel_mode',24);
            $table->string('routing_preference',32);
            $table->string('provider',64)->nullable();
            $table->string('result_basis',32);
            $table->uuid('source_snapshot_id')->nullable();
            $table->unsignedSmallInteger('origin_count');
            $table->unsignedSmallInteger('destination_count');
            $table->unsignedInteger('element_count');
            $table->json('origins');
            $table->json('destinations');
            $table->string('provider_error_code',96)->nullable();
            $table->json('metadata')->nullable();
            $table->dateTime('calculated_at');
            $table->timestamp('stale_at')->nullable();
            $table->string('created_by_user_id',191)->nullable();
            $table->timestamps();
            $table->unique(['company_id','id'],'mtms_company_id_uq');
            $table->index(['company_id','request_signature','calculated_at'],'mtms_signature_time_idx');
            $table->index(['company_id','result_basis','calculated_at'],'mtms_basis_time_idx');
        });
    }

    public function down(): void { /* Forward-safe: matrix provenance/cache history is retained on uninstall. */ }
};
