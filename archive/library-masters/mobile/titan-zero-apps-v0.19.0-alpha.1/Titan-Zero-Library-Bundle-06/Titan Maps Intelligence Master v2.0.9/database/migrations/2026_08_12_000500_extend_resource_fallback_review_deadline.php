<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('maps_resource_fallback_requests')) return;
        Schema::table('maps_resource_fallback_requests', static function(Blueprint $table): void {
            if (!Schema::hasColumn('maps_resource_fallback_requests','review_due_at')) $table->timestamp('review_due_at')->nullable()->index('mrfr_review_due_idx');
            if (!Schema::hasColumn('maps_resource_fallback_requests','escalated_at')) $table->timestamp('escalated_at')->nullable();
        });
    }
    public function down(): void {}
};
