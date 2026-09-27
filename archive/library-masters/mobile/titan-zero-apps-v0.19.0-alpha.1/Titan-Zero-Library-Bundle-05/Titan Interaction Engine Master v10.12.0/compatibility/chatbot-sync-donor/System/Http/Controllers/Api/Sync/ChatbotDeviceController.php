<?php

declare(strict_types=1);

namespace App\Extensions\Chatbot\System\Http\Controllers\Api\Sync;

use App\Extensions\Chatbot\System\Models\ChatbotRegisteredDevice;
use App\Extensions\Chatbot\System\Services\Sync\ChatbotSyncService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatbotDeviceController extends Controller
{
    public function __construct(private ChatbotSyncService $sync) {}

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'device_id'    => ['required', 'uuid'],
            'name'         => ['nullable', 'string', 'max:120'],
            'platform'     => ['nullable', 'string', 'max:80'],
            'app_version'  => ['nullable', 'string', 'max:40'],
            'capabilities' => ['nullable', 'array'],
        ]);

        $device = $this->sync->registerDevice($request->user(), $data);

        return response()->json(['data' => $this->devicePayload($device)], 201);
    }

    public function revoke(Request $request, string $device): JsonResponse
    {
        $model = ChatbotRegisteredDevice::query()
            ->where('tenant_id', $this->sync->tenantId($request->user()))
            ->where('user_id', $request->user()->getAuthIdentifier())
            ->where('uuid', $device)
            ->firstOrFail();

        if (! $model->revoked_at) {
            $model->forceFill(['revoked_at' => now()])->save();
        }

        return response()->json(['data' => $this->devicePayload($model->fresh())]);
    }

    private function devicePayload(ChatbotRegisteredDevice $device): array
    {
        return [
            'device_id'    => $device->uuid,
            'name'         => $device->name,
            'platform'     => $device->platform,
            'app_version'  => $device->app_version,
            'capabilities' => $device->capabilities ?? [],
            'registered'   => true,
            'revoked'      => (bool) $device->revoked_at,
            'last_seen_at' => $device->last_seen_at?->toISOString(),
            'revoked_at'   => $device->revoked_at?->toISOString(),
        ];
    }
}
