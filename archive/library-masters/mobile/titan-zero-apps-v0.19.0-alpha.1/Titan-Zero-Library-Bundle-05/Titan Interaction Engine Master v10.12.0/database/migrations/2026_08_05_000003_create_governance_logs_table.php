<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Backs App\Extensions\InteractionEngine\System\Engines\Executive\Implementations\GovernanceEngine.
 * Added during the fix pass.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('interaction_governance_logs')) {
            return;
        }

        Schema::create('interaction_governance_logs', function (Blueprint $table) {
            $table->id();
            $table->string('company_id', 191)->index();
            $table->json('event');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interaction_governance_logs');
    }
};
