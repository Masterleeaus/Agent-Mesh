<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('work_jobs_evidence_signoffs', function (Blueprint $table) {
            if (!Schema::hasColumn('work_jobs_evidence_signoffs','token')) {
                $table->string('token', 64)->nullable()->after('job_id');
                $table->index(['token'], 'work_ev_signoffs_token_idx');
            }
            if (!Schema::hasColumn('work_jobs_evidence_signoffs','status')) {
                $table->string('status')->nullable()->after('token'); // pending|signed|void
                $table->index(['status'], 'work_ev_signoffs_status_idx');
            }
            if (!Schema::hasColumn('work_jobs_evidence_signoffs','requested_at')) {
                $table->timestamp('requested_at')->nullable()->after('status');
            }
            if (!Schema::hasColumn('work_jobs_evidence_signoffs','completed_at')) {
                $table->timestamp('completed_at')->nullable()->after('requested_at');
            }
            if (!Schema::hasColumn('work_jobs_evidence_signoffs','public_expires_at')) {
                $table->timestamp('public_expires_at')->nullable()->after('completed_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('work_jobs_evidence_signoffs', function (Blueprint $table) {
            if (Schema::hasColumn('work_jobs_evidence_signoffs','public_expires_at')) $table->dropColumn('public_expires_at');
            if (Schema::hasColumn('work_jobs_evidence_signoffs','completed_at')) $table->dropColumn('completed_at');
            if (Schema::hasColumn('work_jobs_evidence_signoffs','requested_at')) $table->dropColumn('requested_at');
            if (Schema::hasColumn('work_jobs_evidence_signoffs','status')) $table->dropColumn('status');
            if (Schema::hasColumn('work_jobs_evidence_signoffs','token')) $table->dropColumn('token');
        });
    }
};
