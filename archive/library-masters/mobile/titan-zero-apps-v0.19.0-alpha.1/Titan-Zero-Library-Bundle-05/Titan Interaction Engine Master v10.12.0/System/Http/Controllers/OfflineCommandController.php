<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Http\Controllers;

use App\Extensions\InteractionEngine\System\Contracts\CommandBusInterface;
use App\Extensions\InteractionEngine\System\Company\CompanyContextResolverContract;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

final class OfflineCommandController
{
    public function __construct(
        private readonly CommandBusInterface $commands,
        private readonly CompanyContextResolverContract $tenants,
    ) {}

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => ['required', 'uuid'],
            'capability' => ['required', 'string', 'max:150'],
            'payload' => ['required', 'array'],
            'metadata' => ['required', 'array'],            // company_id is the sole authoritative company assertion.
            'metadata.company_id' => ['required', 'string', 'max:150'],
            'metadata.device_id' => ['required', 'string', 'max:255'],
            'metadata.approval' => ['sometimes', 'array'],
        ]);

        $user = $request->user();
        $trustedTenant = $this->tenants->companyId($user);
        $reportedCompany = (string) data_get($validated, 'metadata.company_id', '');
        if ($reportedCompany === '' || !hash_equals($trustedTenant, $reportedCompany)) {
            return response()->json(['message' => 'The command company_id does not match the authenticated actor.'], 403);
        }

        $key = 'interaction:offline-command:' . $trustedTenant . ':' . $validated['id'];
        if (!Cache::add($key, ['status' => 'processing'], now()->addDays(30))) {
            return response()->json(['id' => $validated['id'], 'status' => 'duplicate'], 202);
        }

        try {
            $payload = (array) $validated['payload'];
            $payload['_context'] = array_merge((array) ($payload['_context'] ?? []), [
                'company_id' => $trustedTenant,
                'device_id' => (string) data_get($validated, 'metadata.device_id'),
                'user_id' => $user !== null ? (string) data_get($user, 'id') : null,
                'actor_type' => 'human', // authenticated user replaying a device command
                'roles' => $this->normalizeList(data_get($user, 'roles') ?? []),
                // Delegation is reconstructed from authenticated server-side actor data.
                'delegated_scopes' => $this->normalizeList(data_get($user, 'delegated_scopes') ?? []),
                'offline_command_id' => (string) $validated['id'],
            ]);

            // Approval envelopes remain untrusted input until PolicyEngine verifies the
            // server signature, capability, tenant, role, and expiry constraints.
            if (isset($validated['metadata']['approval']) && is_array($validated['metadata']['approval'])) {
                $payload['_approval'] = $validated['metadata']['approval'];
            }

            $this->commands->dispatch((string) $validated['capability'], $payload);
            Cache::put($key, ['status' => 'executed', 'executed_at' => now()->toIso8601String()], now()->addDays(30));

            return response()->json(['id' => $validated['id'], 'status' => 'executed'], 202);
        } catch (\Throwable $error) {
            Cache::forget($key);
            $status = str_contains(strtolower($error->getMessage()), 'conflict') ? 409 : 422;

            return response()->json([
                'id' => $validated['id'],
                'status' => $status === 409 ? 'conflict' : 'rejected',
                'message' => $status === 409 ? 'The authoritative provider reported a conflict.' : 'The offline command was rejected.',
            ], $status);
        }
    }

    /** @return list<string> */
    private function normalizeList(mixed $value): array
    {
        if ($value instanceof \Traversable) {
            $value = iterator_to_array($value);
        }
        if (is_string($value) || is_int($value)) {
            $value = [$value];
        }
        if (!is_array($value)) {
            return [];
        }

        $normalized = [];
        foreach ($value as $item) {
            if (is_string($item) || is_int($item)) {
                $normalized[] = (string) $item;
            } elseif (is_array($item) && isset($item['name'])) {
                $normalized[] = (string) $item['name'];
            } elseif (is_object($item) && isset($item->name)) {
                $normalized[] = (string) $item->name;
            }
        }

        return array_values(array_unique(array_filter($normalized, static fn (string $item): bool => $item !== '')));
    }
}
