<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('qc_records')) {
            return;
        }

        Schema::table('qc_records', function (Blueprint $table) {
            if (!Schema::hasColumn('qc_records', 'property_id')) {
                $table->unsignedBigInteger('property_id')->nullable()->index()->after('schedule_id');
            }

            if (!Schema::hasColumn('qc_records', 'unit_id')) {
                $table->unsignedBigInteger('unit_id')->nullable()->index()->after('property_id');
            }

            if (!Schema::hasColumn('qc_records', 'room_id')) {
                $table->unsignedBigInteger('room_id')->nullable()->index()->after('unit_id');
            }

            if (!Schema::hasColumn('qc_records', 'visit_id')) {
                $table->unsignedBigInteger('visit_id')->nullable()->index()->after('room_id');
            }

            if (!Schema::hasColumn('qc_records', 'legacy_pm_property_inspection_id')) {
                $table->unsignedBigInteger('legacy_pm_property_inspection_id')->nullable()->index()->after('legacy_inspection_id');
            }
        });
    }

    public function down(): void
    {
        // Non-destructive rollback for compatibility migration.
    }
};

