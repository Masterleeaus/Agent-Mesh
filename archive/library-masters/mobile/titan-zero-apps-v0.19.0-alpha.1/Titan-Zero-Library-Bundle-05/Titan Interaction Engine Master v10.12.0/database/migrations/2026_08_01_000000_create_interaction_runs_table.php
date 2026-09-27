<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('interaction_runs')) {
            return;
        }

        Schema::create('interaction_runs', function (Blueprint $table) {
            $table->id();
            $table->string('company_id', 191)->index();
            $table->unsignedBigInteger('user_id');
            $table->string('interaction_id');
            $table->string('definition_version');
            $table->integer('current_section_index')->default(0);
            $table->json('answers')->nullable();
            $table->string('state')->default('started');
            $table->json('meta')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'user_id', 'interaction_id'], 'interaction_runs_company_user_interaction_idx');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interaction_runs');
    }
};
