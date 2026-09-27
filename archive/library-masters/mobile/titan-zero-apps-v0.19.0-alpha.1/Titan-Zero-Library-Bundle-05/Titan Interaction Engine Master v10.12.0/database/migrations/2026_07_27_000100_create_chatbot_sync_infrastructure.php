<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('ext_chatbot_registered_devices', function (Blueprint $table) {
            $table->id(); $table->uuid('uuid'); $table->unsignedBigInteger('tenant_id')->index();
            $table->unsignedBigInteger('user_id')->index(); $table->string('name')->nullable(); $table->string('platform')->nullable();
            $table->string('app_version')->nullable(); $table->timestamp('last_seen_at')->nullable(); $table->timestamp('revoked_at')->nullable();
            $table->json('capabilities')->nullable(); $table->timestamps();
            $table->unique(['tenant_id','user_id','uuid']);
        });
        Schema::create('ext_chatbot_sync_sessions', function (Blueprint $table) {
            $table->id(); $table->uuid('uuid')->unique(); $table->unsignedBigInteger('tenant_id')->index();
            $table->unsignedBigInteger('user_id')->index(); $table->unsignedBigInteger('device_id')->index();
            $table->string('status')->default('running'); $table->unsignedInteger('pushed_count')->default(0);
            $table->unsignedInteger('pulled_count')->default(0); $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable(); $table->text('last_error')->nullable(); $table->timestamps();
        });
        Schema::create('ext_chatbot_sync_operations', function (Blueprint $table) {
            $table->id(); $table->uuid('operation_uuid'); $table->uuid('idempotency_key');
            $table->unsignedBigInteger('tenant_id')->index(); $table->unsignedBigInteger('user_id')->index();
            $table->unsignedBigInteger('device_id')->index(); $table->string('entity_type')->index();
            $table->uuid('local_entity_uuid')->index(); $table->unsignedBigInteger('server_entity_id')->nullable()->index();
            $table->string('action'); $table->unsignedBigInteger('expected_version')->nullable(); $table->json('payload')->nullable();
            $table->json('dependencies')->nullable(); $table->string('status')->default('queued')->index();
            $table->unsignedInteger('retry_count')->default(0); $table->text('last_error')->nullable(); $table->json('result')->nullable();
            $table->timestamp('client_created_at')->nullable(); $table->timestamp('processed_at')->nullable(); $table->timestamps();
            $table->unique(['tenant_id','device_id','operation_uuid'], 'chatbot_sync_operation_uuid_unique');
            $table->unique(['tenant_id','device_id','idempotency_key'], 'chatbot_sync_idempotency_unique');
        });
        Schema::create('ext_chatbot_sync_cursors', function (Blueprint $table) {
            $table->id(); $table->unsignedBigInteger('tenant_id')->index(); $table->unsignedBigInteger('user_id')->index();
            $table->unsignedBigInteger('device_id')->index(); $table->string('entity_type')->default('*');
            $table->unsignedBigInteger('last_sequence')->default(0); $table->timestamp('last_pulled_at')->nullable(); $table->timestamps();
            $table->unique(['tenant_id','user_id','device_id','entity_type'], 'chatbot_sync_cursor_scope_unique');
        });
        Schema::create('ext_chatbot_sync_acknowledgements', function (Blueprint $table) {
            $table->id(); $table->unsignedBigInteger('tenant_id')->index(); $table->unsignedBigInteger('user_id')->index();
            $table->unsignedBigInteger('device_id')->index(); $table->unsignedBigInteger('sync_sequence')->index();
            $table->string('entity_type'); $table->unsignedBigInteger('server_entity_id')->nullable();
            $table->timestamp('acknowledged_at'); $table->timestamps();
            $table->unique(['device_id','sync_sequence','entity_type'], 'chatbot_sync_ack_unique');
        });
        Schema::create('ext_chatbot_sync_conflicts', function (Blueprint $table) {
            $table->id(); $table->uuid('uuid')->unique(); $table->unsignedBigInteger('tenant_id')->index();
            $table->unsignedBigInteger('user_id')->index(); $table->unsignedBigInteger('device_id')->index();
            $table->string('entity_type'); $table->uuid('local_entity_uuid'); $table->unsignedBigInteger('server_entity_id')->nullable();
            $table->string('conflict_type'); $table->json('local_record')->nullable(); $table->json('server_record')->nullable();
            $table->string('status')->default('open')->index(); $table->string('resolution')->nullable();
            $table->json('resolved_record')->nullable(); $table->unsignedBigInteger('resolved_by')->nullable();
            $table->timestamp('resolved_at')->nullable(); $table->timestamps();
        });
        Schema::create('ext_chatbot_sync_tombstones', function (Blueprint $table) {
            $table->id(); $table->unsignedBigInteger('tenant_id')->index(); $table->string('entity_type')->index();
            $table->unsignedBigInteger('server_entity_id')->nullable(); $table->uuid('uuid')->index();
            $table->unsignedBigInteger('sync_sequence')->unique(); $table->unsignedBigInteger('version')->default(1);
            $table->unsignedBigInteger('deleted_by')->nullable(); $table->unsignedBigInteger('originating_device_id')->nullable();
            $table->timestamp('deleted_at'); $table->timestamps();
        });
        Schema::create('ext_chatbot_sync_changes', function (Blueprint $table) {
            $table->bigIncrements('sync_sequence'); $table->unsignedBigInteger('tenant_id')->index();
            $table->unsignedBigInteger('owner_user_id')->index();
            $table->string('entity_type')->index(); $table->unsignedBigInteger('server_entity_id')->nullable()->index();
            $table->uuid('uuid')->index(); $table->unsignedBigInteger('version')->default(1); $table->string('change_type');
            $table->json('record')->nullable(); $table->unsignedBigInteger('modified_by')->nullable();
            $table->unsignedBigInteger('originating_device_id')->nullable(); $table->timestamps();
        });
        foreach (['ext_chatbot_conversations','ext_chatbot_histories','ext_chatbot_customers'] as $name) {
            if (!Schema::hasTable($name)) continue;
            Schema::table($name, function (Blueprint $table) use ($name) {
                if (!Schema::hasColumn($name,'uuid')) $table->uuid('uuid')->nullable()->unique();
                if (!Schema::hasColumn($name,'version')) $table->unsignedBigInteger('version')->default(1);
                if (!Schema::hasColumn($name,'sync_sequence')) $table->unsignedBigInteger('sync_sequence')->nullable()->index();
                if (!Schema::hasColumn($name,'modified_by')) $table->unsignedBigInteger('modified_by')->nullable();
                if (!Schema::hasColumn($name,'originating_device_id')) $table->unsignedBigInteger('originating_device_id')->nullable();
                if (!Schema::hasColumn($name,'deleted_at')) $table->softDeletes();
            });
        }
    }
    public function down(): void
    {
        foreach (['ext_chatbot_conversations','ext_chatbot_histories','ext_chatbot_customers'] as $name) {
            if (! Schema::hasTable($name)) continue;
            Schema::table($name, function (Blueprint $table) use ($name) {
                foreach (['uuid','version','sync_sequence','modified_by','originating_device_id','deleted_at'] as $column) {
                    if (Schema::hasColumn($name, $column)) $table->dropColumn($column);
                }
            });
        }

        foreach (['ext_chatbot_sync_changes','ext_chatbot_sync_tombstones','ext_chatbot_sync_conflicts','ext_chatbot_sync_acknowledgements','ext_chatbot_sync_cursors','ext_chatbot_sync_operations','ext_chatbot_sync_sessions','ext_chatbot_registered_devices'] as $table) Schema::dropIfExists($table);
    }
};
