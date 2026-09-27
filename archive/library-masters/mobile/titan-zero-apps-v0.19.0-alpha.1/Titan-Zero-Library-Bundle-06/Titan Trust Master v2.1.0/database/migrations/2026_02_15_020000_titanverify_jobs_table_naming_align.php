<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('work_jobs_attendance')) {
            Schema::create('work_jobs_attendance', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('company_id')->index();
                $table->unsignedBigInteger('user_id')->index();
                $table->unsignedBigInteger('job_id')->index();
                $table->unsignedBigInteger('staff_user_id')->nullable()->index();

                $table->timestamp('clock_in_at')->nullable();
                $table->string('clock_in_source', 40)->nullable();
                $table->timestamp('clock_out_at')->nullable();
                $table->string('clock_out_source', 40)->nullable();

                $table->timestamp('derived_first_capture_at')->nullable();
                $table->timestamp('derived_last_capture_at')->nullable();

                $table->decimal('lat', 10, 7)->nullable();
                $table->decimal('lng', 10, 7)->nullable();
                $table->decimal('accuracy_m', 8, 2)->nullable();

                $table->text('notes')->nullable();
                $table->timestamps();

                $table->unique(['company_id','user_id','job_id'], 'work_jobs_attendance_tenant_job_uniq');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('work_jobs_attendance')) {
            Schema::drop('work_jobs_attendance');
        }
    }
};
