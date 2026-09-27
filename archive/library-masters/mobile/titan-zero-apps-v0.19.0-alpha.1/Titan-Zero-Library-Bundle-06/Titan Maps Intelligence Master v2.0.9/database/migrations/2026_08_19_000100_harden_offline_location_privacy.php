<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('maps_location_pings')) return;
        Schema::table('maps_location_pings', function (Blueprint $t): void {
            if (! Schema::hasColumn('maps_location_pings','offline_classification')) $t->string('offline_classification',30)->nullable()->index();
            if (! Schema::hasColumn('maps_location_pings','geofence_eligible')) $t->boolean('geofence_eligible')->default(true)->index();
        });
        // Existing offline rows predate explicit classification. Fail privacy-safe: preserve them as
        // history but never allow a later background scan to manufacture retroactive geofence events.
        if (Schema::hasColumn('maps_location_pings','offline_sync')) {
            DB::table('maps_location_pings')->where('offline_sync',true)->whereNull('offline_classification')->update([
                'offline_classification'=>'legacy_historical','geofence_eligible'=>false,
            ]);
        }
    }

    public function down(): void
    {
        // Privacy provenance is retained on rollback/uninstall.
    }
};
