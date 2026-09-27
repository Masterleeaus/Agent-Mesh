<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Backs App\Extensions\InteractionEngine\System\Engines\Learning\Implementations\BehaviourLearningEngine.
 * Added during the fix pass.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('interaction_user_actions')) {
            return;
        }

        Schema::create('interaction_user_actions', function (Blueprint $table) {
            $table->id();
            $table->string('company_id', 191)->index();
            $table->unsignedBigInteger('user_id');
            $table->string('action');
            $table->json('context')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['company_id', 'user_id', 'created_at'], 'interaction_actions_company_user_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interaction_user_actions');
    }
};
