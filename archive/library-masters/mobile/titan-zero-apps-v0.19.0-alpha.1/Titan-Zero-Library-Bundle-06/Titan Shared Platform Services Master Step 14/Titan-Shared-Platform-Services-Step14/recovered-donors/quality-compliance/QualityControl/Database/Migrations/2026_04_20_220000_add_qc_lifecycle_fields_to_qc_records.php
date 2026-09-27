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
            if (!Schema::hasColumn('qc_records', 'severity_level')) {
                $table->string('severity_level', 20)->nullable()->after('status');
                $table->index('severity_level');
            }

            if (!Schema::hasColumn('qc_records', 'risk_score')) {
                $table->unsignedTinyInteger('risk_score')->default(0)->after('overall_score');
                $table->index('risk_score');
            }

            if (!Schema::hasColumn('qc_records', 'reclean_status')) {
                $table->string('reclean_status', 30)->nullable()->after('reclean_triggered');
                $table->index('reclean_status');
            }

            if (!Schema::hasColumn('qc_records', 'reclean_due_at')) {
                $table->timestamp('reclean_due_at')->nullable()->after('reclean_triggered_at');
            }

            if (!Schema::hasColumn('qc_records', 'site_id')) {
                $table->unsignedBigInteger('site_id')->nullable()->after('booking_id');
                $table->index('site_id');
            }

            if (!Schema::hasColumn('qc_records', 'team_id')) {
                $table->unsignedBigInteger('team_id')->nullable()->after('site_id');
                $table->index('team_id');
            }

            if (!Schema::hasColumn('qc_records', 'service_type')) {
                $table->string('service_type', 100)->nullable()->after('team_id');
                $table->index('service_type');
            }
        });
    }

    public function down(): void
    {
        // Non-destructive rollback for production safety.
    }
};
