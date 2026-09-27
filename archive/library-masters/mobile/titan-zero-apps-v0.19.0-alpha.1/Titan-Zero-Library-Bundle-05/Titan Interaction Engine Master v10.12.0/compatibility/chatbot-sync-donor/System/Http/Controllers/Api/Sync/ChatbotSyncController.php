<?php

namespace App\Extensions\Chatbot\System\Http\Controllers\Api\Sync;

use App\Extensions\Chatbot\System\Models\ChatbotSyncConflict;
use App\Extensions\Chatbot\System\Models\ChatbotSyncCursor;
use App\Extensions\Chatbot\System\Models\ChatbotSyncOperation;
use App\Extensions\Chatbot\System\Services\Sync\ChatbotSyncService;
use App\Extensions\Chatbot\System\Services\Sync\SyncEntityRegistry;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ChatbotSyncController extends Controller
{
    public function __construct(
        private ChatbotSyncService $sync,
        private SyncEntityRegistry $registry,
    ) {}

    public function bootstrap(Request $request): JsonResponse
    {
        $data = $request->validate([
            'device_id'  => ['required', 'uuid'],
            'entities'   => ['nullable', 'array'],
            'entities.*' => ['string', Rule::in(array_keys($this->registry->map()))],
            'limit'      => ['nullable', 'integer', 'min:1', 'max:1000'],
        ]);
        $device = $this->sync->device($request->user(), $data['device_id']);
        $entities = $data['entities'] ?? [];
        $pull = $this->sync->pull($request->user(), $device, 0, $entities, min($data['limit'] ?? 500, 1000));

        return response()->json(['data' => [
            ...$pull,
            'device' => [
                'device_id'   => $device->uuid,
                'registered'  => true,
                'revoked'     => false,
                'capabilities'=> $device->capabilities ?? [],
            ],
            'contract' => [
                'version'        => 2,
                'entity_types'   => array_keys($this->registry->map()),
                'push_batch_max' => 100,
                'pull_batch_max' => 500,
            ],
        ]]);
    }

    public function push(Request $request): JsonResponse
    {
        $entityTypes = array_keys($this->registry->map());
        $data = $request->validate([
            'device_id'                          => ['required', 'uuid'],
            'operations'                         => ['required', 'array', 'min:1', 'max:100'],
            'operations.*.operation_uuid'        => ['required', 'uuid', 'distinct'],
            'operations.*.idempotency_key'       => ['required', 'uuid', 'distinct'],
            'operations.*.entity_type'           => ['required', 'string', Rule::in($entityTypes)],
            'operations.*.local_entity_uuid'     => ['required', 'uuid'],
            'operations.*.server_entity_id'      => ['nullable', 'integer', 'min:1'],
            'operations.*.action'                => ['required', Rule::in(['create', 'update', 'delete'])],
            'operations.*.expected_version'      => ['nullable', 'integer', 'min:0'],
            'operations.*.payload'               => ['nullable', 'array'],
            'operations.*.dependencies'          => ['nullable', 'array'],
            'operations.*.dependencies.*'        => ['uuid'],
            'operations.*.created_at'            => ['nullable', 'date'],
            'operations.*.retry_count'           => ['nullable', 'integer', 'min:0'],
        ]);

        $device = $this->sync->device($request->user(), $data['device_id']);
        $result = $this->sync->push($request->user(), $device, $data['operations']);
        $status = ($result['summary']['failed'] + $result['summary']['conflicts'] + $result['summary']['needs_review']) > 0 ? 207 : 200;

        return response()->json(['data' => $result], $status);
    }

    public function pull(Request $request): JsonResponse
    {
        $data = $request->validate([
            'device_id' => ['required', 'uuid'],
            'cursor'    => ['nullable', 'integer', 'min:0'],
            'entities'  => ['nullable', 'string'],
            'limit'     => ['nullable', 'integer', 'min:1', 'max:500'],
        ]);
        $device = $this->sync->device($request->user(), $data['device_id']);
        $entities = array_values(array_filter(explode(',', (string) ($data['entities'] ?? ''))));
        foreach ($entities as $entity) {
            abort_unless($this->registry->supports($entity), 422, "Unsupported entity type: {$entity}");
        }

        return response()->json(['data' => $this->sync->pull(
            $request->user(),
            $device,
            (int) ($data['cursor'] ?? 0),
            $entities,
            (int) ($data['limit'] ?? 100),
        )]);
    }

    public function acknowledge(Request $request): JsonResponse
    {
        $data = $request->validate([
            'device_id'                => ['required', 'uuid'],
            'items'                    => ['required', 'array', 'min:1', 'max:500'],
            'items.*.sync_sequence'    => ['required', 'integer', 'min:1'],
            'items.*.entity_type'      => ['required', 'string', Rule::in(array_keys($this->registry->map()))],
            'items.*.server_entity_id' => ['nullable', 'integer', 'min:1'],
        ]);
        $device = $this->sync->device($request->user(), $data['device_id']);

        return response()->json(['data' => [
            'acknowledged' => $this->sync->acknowledge($request->user(), $device, $data['items']),
        ]]);
    }

    public function status(Request $request): JsonResponse
    {
        $data = $request->validate(['device_id' => ['required', 'uuid']]);
        $device = $this->sync->device($request->user(), $data['device_id']);
        $cursors = ChatbotSyncCursor::query()
            ->where('tenant_id', $device->tenant_id)
            ->where('user_id', $request->user()->getAuthIdentifier())
            ->where('device_id', $device->id)
            ->pluck('last_sequence', 'entity_type');

        return response()->json(['data' => [
            'device_id' => $device->uuid,
            'registered'=> true,
            'revoked'   => false,
            'last_seen_at' => $device->last_seen_at,
            'cursors' => $cursors,
            'pending_server_operations' => ChatbotSyncOperation::query()
                ->where('tenant_id', $device->tenant_id)
                ->where('user_id', $request->user()->getAuthIdentifier())
                ->where('device_id', $device->id)
                ->whereIn('status', ['queued', 'sending', 'failed', 'conflict', 'needs-review'])
                ->count(),
            'open_conflicts' => ChatbotSyncConflict::query()
                ->where('tenant_id', $device->tenant_id)
                ->where('user_id', $request->user()->getAuthIdentifier())
                ->where('device_id', $device->id)
                ->where('status', 'open')
                ->count(),
            'server_time' => now()->toISOString(),
        ]]);
    }

    /**
     * Agent 2 records the chosen resolution. Agent 3 owns resolution policy and UI.
     */
    public function resolve(Request $request, ChatbotSyncConflict $conflict): JsonResponse
    {
        abort_unless(
            $conflict->tenant_id === $this->sync->tenantId($request->user())
            && $conflict->user_id === $request->user()->getAuthIdentifier(),
            404,
        );
        abort_if($conflict->status === 'resolved', 409, 'Conflict has already been resolved.');

        $data = $request->validate([
            'resolution'      => ['required', Rule::in(['keep-local', 'keep-server', 'merged'])],
            'resolved_record' => ['nullable', 'array', 'required_if:resolution,merged'],
        ]);
        $resolved = $this->sync->resolveConflict(
            $request->user(),
            $conflict,
            $data['resolution'],
            $data['resolved_record'] ?? null,
        );

        return response()->json(['data' => $resolved]);
    }
}
