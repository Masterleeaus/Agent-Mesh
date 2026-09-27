<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('interaction_events')) {
            return;
        }

        Schema::create('interaction_events', function (Blueprint $table) {
            $table->id();
            $table->string('company_id', 191)->index();
            $table->unsignedBigInteger('run_id')->nullable();
            $table->string('event_type');
            $table->json('data');
            $table->timestamp('occurred_at');
            $table->timestamps();

            $table->index(['company_id', 'run_id', 'event_type'], 'interaction_events_company_run_type_idx');
            $table->index('occurred_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interaction_events');
    }
};
