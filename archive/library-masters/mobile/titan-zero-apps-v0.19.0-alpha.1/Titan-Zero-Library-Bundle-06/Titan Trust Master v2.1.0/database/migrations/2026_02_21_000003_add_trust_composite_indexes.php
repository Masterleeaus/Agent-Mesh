<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        if (Schema::hasTable('work_trust_containers')) {
            Schema::table('work_trust_containers', function (Blueprint $table) {
                $table->index(['company_id','user_id'], 'wtc_company_user_index');
            });
        }
        if (Schema::hasTable('work_trust_items')) {
            Schema::table('work_trust_items', function (Blueprint $table) {
                $table->index(['company_id','user_id'], 'wti_company_user_index');
            });
        }
    }

    public function down() {
        if (Schema::hasTable('work_trust_containers')) {
            Schema::table('work_trust_containers', function (Blueprint $table) {
                $table->dropIndex('wtc_company_user_index');
            });
        }
        if (Schema::hasTable('work_trust_items')) {
            Schema::table('work_trust_items', function (Blueprint $table) {
                $table->dropIndex('wti_company_user_index');
            });
        }
    }
};
