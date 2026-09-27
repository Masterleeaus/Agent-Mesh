<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Backs App\Extensions\InteractionEngine\System\Engines\Memory\Implementations\EpisodicMemoryEngine.
 * Added during the fix pass — the 80-engine library's Memory domain shipped
 * with no migration for this table, so store()/recall() would fatal with
 * "table not found" on first use.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('interaction_episodic_memory')) {
            return;
        }

        Schema::create('interaction_episodic_memory', function (Blueprint $table) {
            $table->id();
            $table->string('company_id', 191)->index();
            $table->json('event');
            $table->timestamp('timestamp')->useCurrent();
            $table->index(['company_id', 'timestamp'], 'interaction_episodic_company_timestamp_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interaction_episodic_memory');
    }
};
