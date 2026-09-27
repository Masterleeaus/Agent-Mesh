<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('qc_corrective_actions')) {
            return;
        }

        Schema::create('qc_corrective_actions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('company_id')->nullable()->index();
            $table->unsignedBigInteger('qc_record_id')->nullable()->index();
            $table->unsignedBigInteger('complaint_id')->nullable()->index();
            $table->unsignedBigInteger('owner_id')->nullable()->index();
            $table->string('title', 191);
            $table->text('description')->nullable();
            $table->string('status', 30)->default('open')->index();
            $table->string('severity_level', 20)->nullable()->index();
            $table->date('due_date')->nullable()->index();
            $table->timestamp('verified_at')->nullable();
            $table->unsignedBigInteger('verified_by')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qc_corrective_actions');
    }
};
