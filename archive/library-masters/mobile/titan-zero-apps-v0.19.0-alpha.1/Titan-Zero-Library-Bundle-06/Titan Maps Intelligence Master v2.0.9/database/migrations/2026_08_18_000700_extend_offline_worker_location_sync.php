<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('maps_location_pings')) return;
        Schema::table('maps_location_pings', function(Blueprint $t):void{
            if(!Schema::hasColumn('maps_location_pings','client_sample_id'))$t->string('client_sample_id',191)->nullable()->index();
            if(!Schema::hasColumn('maps_location_pings','device_id_hash'))$t->string('device_id_hash',64)->nullable()->index();
            if(!Schema::hasColumn('maps_location_pings','offline_sync'))$t->boolean('offline_sync')->default(false)->index();
            if(!Schema::hasColumn('maps_location_pings','retention_expires_at'))$t->dateTime('retention_expires_at')->nullable()->index();
        });
    }
    public function down(): void
    {
        // Retain offline provenance and location retention evidence for privacy/audit safety.
    }
};
