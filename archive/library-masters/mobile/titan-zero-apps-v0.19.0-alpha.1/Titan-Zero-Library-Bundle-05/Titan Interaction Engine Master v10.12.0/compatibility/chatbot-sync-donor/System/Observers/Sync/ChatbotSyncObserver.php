<?php

declare(strict_types=1);

namespace App\Extensions\Chatbot\System\Observers\Sync;

use App\Extensions\Chatbot\System\Models\ChatbotConversation;
use App\Extensions\Chatbot\System\Models\ChatbotCustomer;
use App\Extensions\Chatbot\System\Models\ChatbotHistory;
use App\Extensions\Chatbot\System\Models\ChatbotSyncChange;
use App\Extensions\Chatbot\System\Models\ChatbotSyncTombstone;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class ChatbotSyncObserver
{
    public function created(Model $model): void
    {
        $this->journal($model, 'create');
    }

    public function updated(Model $model): void
    {
        if ($model->wasChanged(['sync_sequence'])) {
            return;
        }

        $this->journal($model, 'update');
    }

    public function deleted(Model $model): void
    {
        $this->journal($model, 'delete');
    }

    private function journal(Model $model, string $changeType): void
    {
        if (app()->bound('chatbot.sync.applying') && app('chatbot.sync.applying') === true) {
            return;
        }

        if (! Schema::hasTable('ext_chatbot_sync_changes')) {
            return;
        }

        $entityType = match (true) {
            $model instanceof ChatbotConversation => 'conversation',
            $model instanceof ChatbotHistory => 'message',
            $model instanceof ChatbotCustomer => 'customer',
            default => null,
        };

        if ($entityType === null) {
            return;
        }

        $ownerUserId = $this->ownerUserId($model, $entityType);
        if ($ownerUserId === null) {
            return;
        }

        $uuid = (string) ($model->getAttribute('uuid') ?: Str::uuid());
        $version = max(1, (int) ($model->getAttribute('version') ?? 0) + 1);

        if ($changeType !== 'delete') {
            $model->forceFill([
                'uuid' => $uuid,
                'version' => $version,
                'modified_by' => auth()->id(),
                'originating_device_id' => null,
            ])->saveQuietly();
        }

        $change = ChatbotSyncChange::query()->create([
            'tenant_id' => $this->tenantId($ownerUserId),
            'owner_user_id' => $ownerUserId,
            'entity_type' => $entityType,
            'server_entity_id' => $model->getKey(),
            'uuid' => $uuid,
            'version' => $version,
            'change_type' => $changeType,
            'record' => $changeType === 'delete' ? null : $model->fresh()?->toArray(),
            'modified_by' => auth()->id(),
            'originating_device_id' => null,
        ]);

        if ($changeType === 'delete') {
            ChatbotSyncTombstone::query()->updateOrCreate(
                [
                    'tenant_id' => $this->tenantId($ownerUserId),
                    'entity_type' => $entityType,
                    'server_entity_id' => $model->getKey(),
                ],
                [
                    'uuid' => $uuid,
                    'sync_sequence' => $change->sync_sequence,
                    'version' => $version,
                    'deleted_by' => auth()->id(),
                    'originating_device_id' => null,
                    'deleted_at' => now(),
                ],
            );
        } else {
            $model->forceFill(['sync_sequence' => $change->sync_sequence])->saveQuietly();
        }
    }

    private function ownerUserId(Model $model, string $entityType): ?int
    {
        return match ($entityType) {
            'customer' => $model->getAttribute('user_id') ? (int) $model->getAttribute('user_id') : null,
            'conversation' => $model->chatbot?->user_id ? (int) $model->chatbot->user_id : null,
            'message' => $model->conversation?->chatbot?->user_id ? (int) $model->conversation->chatbot->user_id : null,
            default => null,
        };
    }

    private function tenantId(int $ownerUserId): int
    {
        $user = auth()->user();

        if ($user && (int) $user->getAuthIdentifier() === $ownerUserId) {
            return (int) ($user->tenant_id ?? $user->team_id ?? $user->company_id ?? $ownerUserId);
        }

        return $ownerUserId;
    }
}
