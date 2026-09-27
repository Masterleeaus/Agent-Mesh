<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('qc_records')) {
            Schema::table('qc_records', function (Blueprint $table) {
                if (!Schema::hasColumn('qc_records', 'legacy_inspection_id')) {
                    $table->unsignedBigInteger('legacy_inspection_id')->nullable()->index();
                }

                if (!Schema::hasColumn('qc_records', 'approved_at')) {
                    $table->timestamp('approved_at')->nullable();
                }

                if (!Schema::hasColumn('qc_records', 'approved_by')) {
                    $table->unsignedBigInteger('approved_by')->nullable()->index();
                }

                if (!Schema::hasColumn('qc_records', 'reclean_booking_id')) {
                    $table->unsignedBigInteger('reclean_booking_id')->nullable()->index();
                }
            });
        }

        if (Schema::hasTable('qc_record_items')) {
            Schema::table('qc_record_items', function (Blueprint $table) {
                if (!Schema::hasColumn('qc_record_items', 'legacy_item_id')) {
                    $table->unsignedBigInteger('legacy_item_id')->nullable()->index();
                }
            });
        }
    }

    public function down(): void
    {
        // Non-destructive rollback for ownership migration.
    }
};

