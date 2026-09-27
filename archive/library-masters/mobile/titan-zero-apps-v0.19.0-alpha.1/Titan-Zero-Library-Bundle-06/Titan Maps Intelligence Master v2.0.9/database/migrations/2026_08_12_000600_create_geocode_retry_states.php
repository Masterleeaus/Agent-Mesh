<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('maps_geocode_retry_states')) {
            Schema::create('maps_geocode_retry_states', function (Blueprint $table): void {
                $table->uuid('id')->primary();
                $table->uuid('company_id');
                $table->string('reference_type',64);
                $table->string('public_reference_id',128);
                $table->string('address_fingerprint',64);
                $table->unsignedTinyInteger('retry_count')->default(0);
                $table->timestamp('last_geocode_attempt')->nullable();
                $table->timestamp('next_geocode_attempt')->nullable();
                $table->string('last_error_code',96)->nullable();
                $table->timestamp('blocked_at')->nullable();
                $table->timestamps();
                $table->unique(['company_id','reference_type','public_reference_id','address_fingerprint'],'maps_geocode_retry_unique');
                $table->index(['company_id','next_geocode_attempt'],'maps_geocode_retry_due_idx');
            });
        }
        if (Schema::hasTable('map_locations')) {
            Schema::table('map_locations', function (Blueprint $table): void {
                if (!Schema::hasColumn('map_locations','geocode_confidence')) $table->string('geocode_confidence',16)->nullable();
                if (!Schema::hasColumn('map_locations','geocode_version')) $table->string('geocode_version',96)->nullable();
            });
        }
    }

    public function down(): void {}
};
