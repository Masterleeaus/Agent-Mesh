<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('qc_followup_verifications')) {
            return;
        }

        Schema::create('qc_followup_verifications', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('company_id')->nullable()->index();
            $table->unsignedBigInteger('qc_record_id')->nullable()->index();
            $table->unsignedBigInteger('schedule_id')->nullable()->index();
            $table->unsignedBigInteger('complaint_id')->nullable()->index();
            $table->unsignedBigInteger('assigned_to')->nullable()->index();
            $table->string('status', 30)->default('queued')->index();
            $table->timestamp('due_at')->nullable()->index();
            $table->timestamp('verified_at')->nullable();
            $table->unsignedBigInteger('verified_by')->nullable()->index();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qc_followup_verifications');
    }
};
