<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('work_jobs_evidence', function (Blueprint $table) {
            if (!Schema::hasColumn('work_jobs_evidence','tags')) {
                $table->json('tags')->nullable()->after('caption');
            }
            if (!Schema::hasColumn('work_jobs_evidence','search_text')) {
                $table->text('search_text')->nullable()->after('tags');
            }
        });
    }

    public function down(): void
    {
        Schema::table('work_jobs_evidence', function (Blueprint $table) {
            if (Schema::hasColumn('work_jobs_evidence','search_text')) {
                $table->dropColumn('search_text');
            }
            if (Schema::hasColumn('work_jobs_evidence','tags')) {
                $table->dropColumn('tags');
            }
        });
    }
};
