<?php

namespace App\Extensions\Chatbot\System\Services\Sync;

use App\Extensions\Chatbot\System\Models\ChatbotRegisteredDevice;
use App\Extensions\Chatbot\System\Models\ChatbotSyncAcknowledgement;
use App\Extensions\Chatbot\System\Models\ChatbotSyncChange;
use App\Extensions\Chatbot\System\Models\ChatbotSyncConflict;
use App\Extensions\Chatbot\System\Models\ChatbotSyncCursor;
use App\Extensions\Chatbot\System\Models\ChatbotSyncOperation;
use App\Extensions\Chatbot\System\Models\ChatbotSyncSession;
use App\Extensions\Chatbot\System\Models\ChatbotSyncTombstone;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ChatbotSyncService
{
    public function __construct(private SyncEntityRegistry $registry) {}

    public function tenantId(Authenticatable $user): int
    {
        return (int) ($user->tenant_id ?? $user->team_id ?? $user->company_id ?? $user->getAuthIdentifier());
    }

    public function device(Authenticatable $user, string $uuid): ChatbotRegisteredDevice
    {
        $device = ChatbotRegisteredDevice::query()
            ->where('tenant_id', $this->tenantId($user))
            ->where('user_id', $user->getAuthIdentifier())
            ->where('uuid', $uuid)
            ->first();

        if (! $device || $device->revoked_at) {
            throw new SyncProtocolException('Device is not registered or has been revoked.', 'DEVICE_NOT_AVAILABLE', 403);
        }

        $device->forceFill(['last_seen_at' => now()])->save();

        return $device;
    }

    public function registerDevice(Authenticatable $user, array $data): ChatbotRegisteredDevice
    {
        return ChatbotRegisteredDevice::query()->updateOrCreate(
            [
                'tenant_id' => $this->tenantId($user),
                'user_id'   => $user->getAuthIdentifier(),
                'uuid'      => $data['device_id'],
            ],
            [
                'name'         => $data['name'] ?? null,
                'platform'     => $data['platform'] ?? null,
                'app_version'  => $data['app_version'] ?? null,
                'capabilities' => $data['capabilities'] ?? [],
                'last_seen_at' => now(),
                'revoked_at'   => null,
            ],
        );
    }

    public function push(Authenticatable $user, ChatbotRegisteredDevice $device, array $operations): array
    {
        $session = ChatbotSyncSession::query()->create([
            'uuid'       => (string) Str::uuid(),
            'tenant_id'  => $device->tenant_id,
            'user_id'    => $user->getAuthIdentifier(),
            'device_id'  => $device->id,
            'status'     => 'running',
            'started_at' => now(),
        ]);

        $results = [];
        $completedOperationUuids = [];

        foreach ($this->dependencyOrder($operations) as $operation) {
            $existing = ChatbotSyncOperation::query()
                ->where('tenant_id', $device->tenant_id)
                ->where('user_id', $user->getAuthIdentifier())
                ->where('device_id', $device->id)
                ->where('idempotency_key', $operation['idempotency_key'])
                ->first();

            if ($existing) {
                $result = $existing->result ?? [
                    'operation_uuid' => $existing->operation_uuid,
                    'status'         => $existing->status,
                ];
                $results[] = $result;
                if (($result['status'] ?? null) === 'synced') {
                    $completedOperationUuids[] = $operation['operation_uuid'];
                }
                continue;
            }

            $unresolved = $this->unresolvedDependencies($operation, $completedOperationUuids, $device);
            if ($unresolved !== []) {
                $result = $this->dependencyFailure($operation, $unresolved);
                $this->storeOperation($user, $device, $operation, 'needs-review', $result);
                $results[] = $result;
                continue;
            }

            $stored = $this->storeOperation($user, $device, $operation, 'sending');

            try {
                app()->instance('chatbot.sync.applying', true);
                try {
                    $result = DB::transaction(fn (): array => $this->apply($user, $device, $operation), 3);
                } finally {
                    app()->instance('chatbot.sync.applying', false);
                }
                $stored->update(['status' => 'synced', 'result' => $result, 'processed_at' => now()]);
                $completedOperationUuids[] = $operation['operation_uuid'];
            } catch (SyncProtocolException $exception) {
                $status = in_array($exception->httpStatus, [409, 412], true) ? 'conflict' : 'failed';
                $result = [
                    'operation_uuid' => $operation['operation_uuid'],
                    'status'         => $status,
                    'http_status'    => $exception->httpStatus,
                    'error'          => [
                        'code'    => $exception->syncCode,
                        'message' => $exception->getMessage(),
                        'context' => $exception->context,
                    ],
                ];
                $stored->update([
                    'status'       => $status,
                    'last_error'   => $exception->getMessage(),
                    'result'       => $result,
                    'processed_at' => now(),
                ]);
            } catch (\Throwable $exception) {
                report($exception);
                $result = [
                    'operation_uuid' => $operation['operation_uuid'],
                    'status'         => 'failed',
                    'http_status'    => 500,
                    'error'          => [
                        'code'    => 'SYNC_OPERATION_FAILED',
                        'message' => 'The server could not process this operation.',
                    ],
                ];
                $stored->update([
                    'status'       => 'failed',
                    'last_error'   => $exception->getMessage(),
                    'result'       => $result,
                    'processed_at' => now(),
                ]);
            }

            $results[] = $result;
        }

        $failed = collect($results)->whereIn('status', ['failed', 'conflict', 'needs-review'])->count();
        $session->update([
            'status'       => $failed > 0 ? 'completed-with-errors' : 'completed',
            'pushed_count' => count($results),
            'last_error'   => $failed > 0 ? "{$failed} operation(s) require attention." : null,
            'completed_at' => now(),
        ]);

        return [
            'session_uuid' => $session->uuid,
            'results'      => $results,
            'summary'      => [
                'total'          => count($results),
                'synced'         => collect($results)->where('status', 'synced')->count(),
                'failed'         => collect($results)->where('status', 'failed')->count(),
                'conflicts'      => collect($results)->where('status', 'conflict')->count(),
                'needs_review'   => collect($results)->where('status', 'needs-review')->count(),
            ],
        ];
    }

    private function apply(Authenticatable $user, ChatbotRegisteredDevice $device, array $operation): array
    {
        $type = $operation['entity_type'];
        if (! $this->registry->supports($type)) {
            throw new SyncProtocolException("Unsupported entity type: {$type}", 'ENTITY_TYPE_UNSUPPORTED', 422);
        }

        $model = $this->registry->model($type);
        $payload = Arr::only($operation['payload'] ?? [], $this->registry->allowed($type));
        $this->registry->assertPayloadAuthorized($type, $payload, $user);
        $record = $this->findRecord($type, $user, $operation);
        $action = $operation['action'];

        if ($action === 'create' && $record) {
            if ($this->samePayload($record, $payload)) {
                return $this->canonicalResult($operation, $type, $record);
            }

            $conflict = $this->createConflict($user, $device, $operation, $record, 'duplicate_local_creation');
            throw new SyncProtocolException(
                'A server record already exists for this local UUID.',
                'DUPLICATE_LOCAL_CREATION',
                409,
                ['conflict_uuid' => $conflict->uuid],
            );
        }

        if ($action === 'update' && ! $record) {
            throw new SyncProtocolException('The record no longer exists on the server.', 'REMOTE_RECORD_MISSING', 409);
        }

        if ($action === 'delete') {
            if (! $record) {
                return [
                    'operation_uuid'    => $operation['operation_uuid'],
                    'status'            => 'synced',
                    'entity_type'       => $type,
                    'local_entity_uuid' => $operation['local_entity_uuid'],
                    'server_entity_id'  => $operation['server_entity_id'] ?? null,
                    'deleted'           => true,
                    'already_deleted'   => true,
                ];
            }

            $this->assertVersion($record, $operation, $user, $device);
            $uuid = $record->uuid ?: $operation['local_entity_uuid'];
            $version = (int) ($record->version ?? 1) + 1;
            $serverId = $record->getKey();
            $record->forceFill([
                'uuid'                  => $uuid,
                'version'               => $version,
                'modified_by'           => $user->getAuthIdentifier(),
                'originating_device_id' => $device->id,
            ])->saveQuietly();
            $record->delete();

            $change = ChatbotSyncChange::query()->create([
                'tenant_id'             => $device->tenant_id,
                'owner_user_id'          => $user->getAuthIdentifier(),
                'entity_type'           => $type,
                'server_entity_id'      => $serverId,
                'uuid'                  => $uuid,
                'version'               => $version,
                'change_type'           => 'delete',
                'record'                => null,
                'modified_by'           => $user->getAuthIdentifier(),
                'originating_device_id' => $device->id,
            ]);

            ChatbotSyncTombstone::query()->updateOrCreate(
                [
                    'tenant_id'        => $device->tenant_id,
                    'entity_type'      => $type,
                    'server_entity_id' => $serverId,
                ],
                [
                    'uuid'                  => $uuid,
                    'sync_sequence'         => $change->sync_sequence,
                    'version'               => $version,
                    'deleted_by'            => $user->getAuthIdentifier(),
                    'originating_device_id' => $device->id,
                    'deleted_at'            => now(),
                ],
            );

            return [
                'operation_uuid'    => $operation['operation_uuid'],
                'status'            => 'synced',
                'entity_type'       => $type,
                'local_entity_uuid' => $uuid,
                'server_entity_id'  => $serverId,
                'version'           => $version,
                'sync_sequence'     => $change->sync_sequence,
                'deleted'           => true,
            ];
        }

        if ($record) {
            $this->assertVersion($record, $operation, $user, $device);
        }

        $record = $record ?: $model->newInstance();
        $record->fill($payload);

        if ($type === 'customer') {
            $record->user_id = $user->getAuthIdentifier();
        }

        $record->uuid = $record->uuid ?: $operation['local_entity_uuid'];
        $record->version = (int) ($record->version ?? 0) + 1;
        $record->modified_by = $user->getAuthIdentifier();
        $record->originating_device_id = $device->id;
        $record->save();

        $change = ChatbotSyncChange::query()->create([
            'tenant_id'             => $device->tenant_id,
            'owner_user_id'          => $user->getAuthIdentifier(),
            'entity_type'           => $type,
            'server_entity_id'      => $record->getKey(),
            'uuid'                  => $record->uuid,
            'version'               => $record->version,
            'change_type'           => $record->wasRecentlyCreated ? 'create' : 'update',
            'record'                => $record->fresh()->toArray(),
            'modified_by'           => $user->getAuthIdentifier(),
            'originating_device_id' => $device->id,
        ]);

        $record->forceFill(['sync_sequence' => $change->sync_sequence])->saveQuietly();

        return $this->canonicalResult($operation, $type, $record->fresh(), $change->sync_sequence);
    }

    private function findRecord(string $type, Authenticatable $user, array $operation): ?Model
    {
        $query = $this->registry->query($type, $user);

        if (! empty($operation['server_entity_id'])) {
            return (clone $query)->whereKey($operation['server_entity_id'])->first();
        }

        if (! empty($operation['local_entity_uuid'])) {
            return (clone $query)->where('uuid', $operation['local_entity_uuid'])->first();
        }

        return null;
    }

    private function assertVersion(Model $record, array $operation, Authenticatable $user, ChatbotRegisteredDevice $device): void
    {
        $expected = $operation['expected_version'] ?? null;
        if ($expected === null || (int) $expected === (int) ($record->version ?? 1)) {
            return;
        }

        $conflict = $this->createConflict($user, $device, $operation, $record, 'version_mismatch');

        throw new SyncProtocolException(
            'The server record changed after the local copy was read.',
            'VERSION_CONFLICT',
            412,
            [
                'conflict_uuid'  => $conflict->uuid,
                'expected'       => (int) $expected,
                'server_version' => (int) ($record->version ?? 1),
            ],
        );
    }

    private function createConflict(
        Authenticatable $user,
        ChatbotRegisteredDevice $device,
        array $operation,
        Model $record,
        string $type,
    ): ChatbotSyncConflict {
        return ChatbotSyncConflict::query()->create([
            'uuid'                  => (string) Str::uuid(),
            'tenant_id'             => $device->tenant_id,
            'user_id'               => $user->getAuthIdentifier(),
            'device_id'             => $device->id,
            'entity_type'           => $operation['entity_type'],
            'local_entity_uuid'     => $operation['local_entity_uuid'],
            'server_entity_id'      => $record->getKey(),
            'conflict_type'         => $type,
            'local_record'          => $operation['payload'] ?? [],
            'server_record'         => $record->toArray(),
            'status'                => 'open',
        ]);
    }

    public function pull(
        Authenticatable $user,
        ChatbotRegisteredDevice $device,
        int $cursor,
        array $entities,
        int $limit,
    ): array {
        $session = ChatbotSyncSession::query()->create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $device->tenant_id,
            'user_id' => $user->getAuthIdentifier(),
            'device_id' => $device->id,
            'status' => 'running',
            'started_at' => now(),
        ]);

        $entities = array_values(array_filter($entities, fn (string $type): bool => $this->registry->supports($type)));
        $query = ChatbotSyncChange::query()
            ->where('tenant_id', $device->tenant_id)
            ->where('owner_user_id', $user->getAuthIdentifier())
            ->where('sync_sequence', '>', $cursor)
            ->orderBy('sync_sequence');

        if ($entities !== []) {
            $query->whereIn('entity_type', $entities);
        }

        $changes = $query->limit($limit + 1)->get();
        $hasMore = $changes->count() > $limit;
        $changes = $changes->take($limit)->values();
        $next = (int) ($changes->last()->sync_sequence ?? $cursor);
        $cursorKey = count($entities) === 1 ? $entities[0] : '*';

        ChatbotSyncCursor::query()->updateOrCreate(
            [
                'tenant_id'  => $device->tenant_id,
                'user_id'    => $user->getAuthIdentifier(),
                'device_id'  => $device->id,
                'entity_type'=> $cursorKey,
            ],
            [
                'last_sequence' => $next,
                'last_pulled_at'=> now(),
            ],
        );

        $session->update([
            'status' => $hasMore ? 'partial' : 'completed',
            'pulled_count' => $changes->count(),
            'completed_at' => now(),
        ]);

        return [
            'session_uuid' => $session->uuid,
            'changes' => $changes->map(static fn (ChatbotSyncChange $change): array => [
                'sync_sequence'        => $change->sync_sequence,
                'entity_type'          => $change->entity_type,
                'server_entity_id'     => $change->server_entity_id,
                'local_uuid'           => $change->uuid,
                'version'              => $change->version,
                'change_type'          => $change->change_type,
                'record'               => $change->record,
                'modified_by'          => $change->modified_by,
                'originating_device_id'=> $change->originating_device_id,
                'changed_at'           => $change->created_at?->toISOString(),
            ])->all(),
            'next_cursor' => $next,
            'has_more'    => $hasMore,
            'server_time' => now()->toISOString(),
        ];
    }

    public function acknowledge(Authenticatable $user, ChatbotRegisteredDevice $device, array $items): int
    {
        $acknowledged = 0;

        foreach ($items as $item) {
            $changeExists = ChatbotSyncChange::query()
                ->where('tenant_id', $device->tenant_id)
                ->where('owner_user_id', $user->getAuthIdentifier())
                ->where('sync_sequence', $item['sync_sequence'])
                ->where('entity_type', $item['entity_type'])
                ->exists();

            if (! $changeExists) {
                continue;
            }

            ChatbotSyncAcknowledgement::query()->firstOrCreate(
                [
                    'tenant_id'     => $device->tenant_id,
                    'user_id'       => $user->getAuthIdentifier(),
                    'device_id'     => $device->id,
                    'sync_sequence' => $item['sync_sequence'],
                    'entity_type'   => $item['entity_type'],
                ],
                [
                    'server_entity_id' => $item['server_entity_id'] ?? null,
                    'acknowledged_at'  => now(),
                ],
            );
            $acknowledged++;
        }

        return $acknowledged;
    }

    public function resolveConflict(
        Authenticatable $user,
        ChatbotSyncConflict $conflict,
        string $resolution,
        ?array $resolvedRecord,
    ): ChatbotSyncConflict {
        $record = $this->registry->query($conflict->entity_type, $user)
            ->whereKey($conflict->server_entity_id)
            ->first();

        app()->instance('chatbot.sync.applying', true);
        try {
            DB::transaction(function () use ($user, $conflict, $resolution, $resolvedRecord, $record): void {
                if ($resolution === 'keep-local' || $resolution === 'merged') {
                    if (! $record) {
                        throw new SyncProtocolException('The conflicted server record no longer exists.', 'CONFLICT_RECORD_MISSING', 409);
                    }

                    $payload = $resolution === 'keep-local'
                        ? (array) $conflict->local_record
                        : (array) $resolvedRecord;
                    $payload = Arr::only($payload, $this->registry->allowed($conflict->entity_type));
                    $this->registry->assertPayloadAuthorized($conflict->entity_type, $payload, $user);

                    $record->fill($payload);
                    $record->version = (int) ($record->version ?? 1) + 1;
                    $record->modified_by = $user->getAuthIdentifier();
                    $record->originating_device_id = $conflict->device_id;
                    $record->saveQuietly();

                    $change = ChatbotSyncChange::query()->create([
                        'tenant_id' => $conflict->tenant_id,
                        'owner_user_id' => $conflict->user_id,
                        'entity_type' => $conflict->entity_type,
                        'server_entity_id' => $record->getKey(),
                        'uuid' => $record->uuid,
                        'version' => $record->version,
                        'change_type' => 'update',
                        'record' => $record->fresh()->toArray(),
                        'modified_by' => $user->getAuthIdentifier(),
                        'originating_device_id' => $conflict->device_id,
                    ]);
                    $record->forceFill(['sync_sequence' => $change->sync_sequence])->saveQuietly();
                }

                $conflict->update([
                    'status' => 'resolved',
                    'resolution' => $resolution,
                    'resolved_record' => $resolvedRecord,
                    'resolved_by' => $user->getAuthIdentifier(),
                    'resolved_at' => now(),
                ]);

                ChatbotSyncOperation::query()
                    ->where('tenant_id', $conflict->tenant_id)
                    ->where('user_id', $conflict->user_id)
                    ->where('device_id', $conflict->device_id)
                    ->where('entity_type', $conflict->entity_type)
                    ->where('local_entity_uuid', $conflict->local_entity_uuid)
                    ->where('status', 'conflict')
                    ->update([
                        'status' => 'needs-review',
                        'last_error' => null,
                        'processed_at' => now(),
                    ]);
            }, 3);
        } finally {
            app()->instance('chatbot.sync.applying', false);
        }

        return $conflict->fresh();
    }

    private function canonicalResult(array $operation, string $type, Model $record, ?int $sequence = null): array
    {
        return [
            'operation_uuid'    => $operation['operation_uuid'],
            'status'            => 'synced',
            'entity_type'       => $type,
            'local_entity_uuid' => $operation['local_entity_uuid'],
            'server_entity_id'  => $record->getKey(),
            'version'           => (int) ($record->version ?? 1),
            'sync_sequence'     => $sequence ?? $record->sync_sequence,
            'record'            => $record->toArray(),
        ];
    }

    private function samePayload(Model $record, array $payload): bool
    {
        foreach ($payload as $key => $value) {
            if ($record->getAttribute($key) != $value) {
                return false;
            }
        }

        return true;
    }

    private function storeOperation(
        Authenticatable $user,
        ChatbotRegisteredDevice $device,
        array $operation,
        string $status,
        ?array $result = null,
    ): ChatbotSyncOperation {
        return ChatbotSyncOperation::query()->create([
            ...Arr::only($operation, [
                'operation_uuid', 'idempotency_key', 'entity_type', 'local_entity_uuid',
                'server_entity_id', 'action', 'expected_version', 'payload', 'dependencies',
                'retry_count', 'last_error',
            ]),
            'tenant_id' => $device->tenant_id,
            'user_id'   => $user->getAuthIdentifier(),
            'device_id' => $device->id,
            'status'    => $status,
            'client_created_at' => $operation['created_at'] ?? null,
            'result'    => $result,
            'processed_at' => $result ? now() : null,
        ]);
    }

    private function dependencyOrder(array $operations): array
    {
        $remaining = collect($operations)->keyBy('operation_uuid');
        $ordered = [];
        $progress = true;

        while ($remaining->isNotEmpty() && $progress) {
            $progress = false;
            foreach ($remaining as $uuid => $operation) {
                $dependencies = collect($operation['dependencies'] ?? []);
                $batchDependencies = $dependencies->filter(fn ($dependency): bool => $remaining->has((string) $dependency));
                if ($batchDependencies->isNotEmpty()) {
                    continue;
                }
                $ordered[] = $operation;
                $remaining->forget($uuid);
                $progress = true;
            }
        }

        return [...$ordered, ...$remaining->values()->all()];
    }

    private function unresolvedDependencies(
        array $operation,
        array $completedOperationUuids,
        ChatbotRegisteredDevice $device,
    ): array {
        $dependencies = array_values(array_unique($operation['dependencies'] ?? []));
        if ($dependencies === []) {
            return [];
        }

        $persisted = ChatbotSyncOperation::query()
            ->where('tenant_id', $device->tenant_id)
            ->where('user_id', $device->user_id)
            ->where('device_id', $device->id)
            ->whereIn('operation_uuid', $dependencies)
            ->where('status', 'synced')
            ->pluck('operation_uuid')
            ->all();

        return array_values(array_diff($dependencies, [...$completedOperationUuids, ...$persisted]));
    }

    private function dependencyFailure(array $operation, array $unresolved): array
    {
        return [
            'operation_uuid' => $operation['operation_uuid'],
            'status'         => 'needs-review',
            'http_status'    => 424,
            'error'          => [
                'code'         => 'DEPENDENCY_UNRESOLVED',
                'message'      => 'One or more required operations have not completed.',
                'dependencies' => $unresolved,
            ],
        ];
    }
}
