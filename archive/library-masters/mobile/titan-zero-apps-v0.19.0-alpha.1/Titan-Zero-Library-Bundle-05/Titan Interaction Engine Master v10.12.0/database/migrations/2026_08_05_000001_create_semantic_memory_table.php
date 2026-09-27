<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Backs App\Extensions\InteractionEngine\System\Engines\Memory\Implementations\SemanticMemoryEngine.
 * Added during the fix pass — see episodic_memory migration note.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('interaction_semantic_memory')) {
            return;
        }

        Schema::create('interaction_semantic_memory', function (Blueprint $table) {
            $table->id();
            $table->string('company_id', 191)->index();
            $table->json('fact');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interaction_semantic_memory');
    }
};
