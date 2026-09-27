<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    private const TABLES = [
        'ext_chatbot_registered_devices',
        'ext_chatbot_sync_sessions',
        'ext_chatbot_sync_operations',
        'ext_chatbot_sync_cursors',
        'ext_chatbot_sync_acknowledgements',
        'ext_chatbot_sync_conflicts',
        'ext_chatbot_sync_tombstones',
        'ext_chatbot_sync_changes',
    ];

    public function up(): void
    {
        foreach (self::TABLES as $tableName) {
            if (! Schema::hasTable($tableName)) {
                continue;
            }

            $hasLegacy = Schema::hasColumn($tableName, 'tenant_id');
            $hasCanonical = Schema::hasColumn($tableName, 'company_id');

            if ($hasLegacy && $hasCanonical) {
                throw new RuntimeException(
                    "Chatbot sync table [{$tableName}] contains both tenant_id and company_id. " .
                    'Resolve the ambiguous authority boundary before continuing.'
                );
            }

            if ($hasLegacy) {
                Schema::table($tableName, function (Blueprint $table): void {
                    $table->renameColumn('tenant_id', 'company_id');
                });
            }
        }
    }

    public function down(): void
    {
        foreach (array_reverse(self::TABLES) as $tableName) {
            if (! Schema::hasTable($tableName) || ! Schema::hasColumn($tableName, 'company_id')) {
                continue;
            }

            if (Schema::hasColumn($tableName, 'tenant_id')) {
                throw new RuntimeException("Cannot restore legacy boundary for [{$tableName}]: tenant_id already exists.");
            }

            Schema::table($tableName, function (Blueprint $table): void {
                $table->renameColumn('company_id', 'tenant_id');
            });
        }
    }
};
