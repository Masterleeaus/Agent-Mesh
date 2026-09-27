<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        if (Schema::hasTable('work_trust_events')) {
            Schema::table('work_trust_events', function (Blueprint $table) {
                $table->index(['company_id','user_id'], 'wte_company_user_index');
            });
        }
    }

    public function down() {
        if (Schema::hasTable('work_trust_events')) {
            Schema::table('work_trust_events', function (Blueprint $table) {
                $table->dropIndex('wte_company_user_index');
            });
        }
    }
};
