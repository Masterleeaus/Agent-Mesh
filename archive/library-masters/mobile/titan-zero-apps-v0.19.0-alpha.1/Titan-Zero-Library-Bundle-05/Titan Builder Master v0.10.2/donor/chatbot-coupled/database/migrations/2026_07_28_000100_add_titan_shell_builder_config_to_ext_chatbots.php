<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('ext_chatbots')) {
            return;
        }

        Schema::table('ext_chatbots', function (Blueprint $table): void {
            if (! Schema::hasColumn('ext_chatbots', 'titan_template')) {
                $table->string('titan_template', 80)->nullable()->index();
            }
            if (! Schema::hasColumn('ext_chatbots', 'shell_builder_config')) {
                $table->json('shell_builder_config')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('ext_chatbots')) {
            return;
        }

        Schema::table('ext_chatbots', function (Blueprint $table): void {
            foreach (['shell_builder_config', 'titan_template'] as $column) {
                if (Schema::hasColumn('ext_chatbots', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
