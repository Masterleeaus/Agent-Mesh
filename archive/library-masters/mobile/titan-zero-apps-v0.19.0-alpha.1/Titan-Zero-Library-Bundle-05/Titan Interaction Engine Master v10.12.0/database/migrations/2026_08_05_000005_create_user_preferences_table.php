<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Backs App\Extensions\InteractionEngine\System\Engines\Learning\Implementations\PreferenceLearningEngine.
 * Added during the fix pass.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('interaction_user_preferences')) {
            return;
        }

        Schema::create('interaction_user_preferences', function (Blueprint $table) {
            $table->id();
            $table->string('company_id', 191)->index();
            $table->unsignedBigInteger('user_id');
            $table->string('key');
            $table->json('value')->nullable();
            $table->timestamp('updated_at')->useCurrent();
            $table->unique(['company_id', 'user_id', 'key'], 'interaction_preferences_company_user_key_uq');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interaction_user_preferences');
    }
};
