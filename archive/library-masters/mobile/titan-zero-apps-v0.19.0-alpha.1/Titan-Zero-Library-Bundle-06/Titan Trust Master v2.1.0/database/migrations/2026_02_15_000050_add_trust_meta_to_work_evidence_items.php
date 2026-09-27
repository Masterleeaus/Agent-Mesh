<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('work_jobs_evidence', function (Blueprint $table) {
            if (!Schema::hasColumn('work_jobs_evidence','captured_lat')) {
                $table->decimal('captured_lat', 10, 7)->nullable()->after('captured_at');
                $table->decimal('captured_lng', 10, 7)->nullable()->after('captured_lat');
                $table->decimal('captured_accuracy_m', 8, 2)->nullable()->after('captured_lng');
                $table->string('captured_source', 30)->nullable()->after('captured_accuracy_m'); // device|manual|unknown
                $table->index(['captured_lat','captured_lng'], 'work_ev_items_latlng_idx');
            }

            if (!Schema::hasColumn('work_jobs_evidence','trust_level')) {
                $table->string('trust_level', 20)->nullable()->after('captured_source'); // low|medium|high
                $table->json('trust_flags')->nullable()->after('trust_level'); // ["no_gps","low_accuracy","manual_time"]
                $table->index(['trust_level'], 'work_ev_items_trust_level_idx');
            }
        });
    }

    public function down(): void
    {
        Schema::table('work_jobs_evidence', function (Blueprint $table) {
            foreach (['trust_flags','trust_level','captured_source','captured_accuracy_m','captured_lng','captured_lat'] as $col) {
                if (Schema::hasColumn('work_jobs_evidence', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
