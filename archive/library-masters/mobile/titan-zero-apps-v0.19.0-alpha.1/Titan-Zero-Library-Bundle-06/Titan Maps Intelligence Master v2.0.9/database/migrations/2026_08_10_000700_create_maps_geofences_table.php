<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('maps_geofences')) return;
        Schema::create('maps_geofences', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id', 64)->index('mgf_company_idx');
            $table->string('branch_id', 64)->nullable();
            $table->string('workspace_id', 64)->nullable();
            $table->string('name', 191);
            $table->text('description')->nullable();
            $table->string('shape_type', 16);
            $table->decimal('center_latitude', 10, 7)->nullable();
            $table->decimal('center_longitude', 11, 7)->nullable();
            $table->decimal('radius_metres', 12, 2)->nullable();
            $table->json('geometry')->nullable();
            $table->string('reference_type', 32)->nullable();
            $table->string('public_reference_id', 191)->nullable();
            $table->boolean('enabled')->default(true);
            $table->boolean('arrival_confirmation_required')->default(true);
            $table->boolean('departure_confirmation_required')->default(true);
            $table->unsignedInteger('dwell_seconds')->default(300);
            $table->string('created_by_user_id', 191)->nullable();
            $table->string('updated_by_user_id', 191)->nullable();
            $table->timestamps();
            $table->unique(['company_id','id'], 'mgf_company_id_uq');
            $table->index(['company_id','enabled'], 'mgf_company_enabled_idx');
            $table->index(['company_id','reference_type','public_reference_id'], 'mgf_reference_idx');
            $table->index(['company_id','branch_id','enabled'], 'mgf_branch_enabled_idx');
        });
    }
    public function down(): void { /* Forward-safe: geofence definitions are retained on uninstall. */ }
};
