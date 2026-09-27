<?php

declare(strict_types=1);

namespace App\Extensions\TitanGo\System\Integration;

use App\Extensions\InteractionEngine\System\Contracts\CapabilityIntentGatewayInterface;
use App\Extensions\TitanGo\System\Contracts\GoActionIntentGatewayInterface;
use InvalidArgumentException;

/**
 * Titan Go action adapter.
 *
 * Go never executes provider mutations directly. It converts a worker action
 * into a governed Interaction Engine capability intent with trusted Go scope.
 */
final class InteractionEngineGoActionIntentGateway implements GoActionIntentGatewayInterface
{
    private const MAX_DEPTH = 20;
    private const MAX_NODES = 5000;

    /** @var list<string> */
    private const FORBIDDEN_CONTEXT_KEYS = [
        'tenantid', 'tenantcompanyid', 'tenantscope', 'tenantboundary',
        'permissions', 'entitlements', 'autonomyauthority', 'approvalauthority',
        'providercredentials', 'credentials', 'password', 'secret',
        'accesstoken', 'refreshtoken', 'bearertoken', 'authorization',
    ];

    public function __construct(private CapabilityIntentGatewayInterface $gateway) {}

    public function submit(
        string $companyId,
        string $workerId,
        string $intent,
        array $payload,
        array $context = []
    ): array {
        $companyId = $this->requiredIdentity($companyId, 'company_id');
        $workerId = $this->requiredIdentity($workerId, 'actor_id');
        $intent = trim($intent);
        if (!preg_match('/^[a-z0-9][a-z0-9._:-]{2,190}$/', $intent)) {
            throw new InvalidArgumentException('Titan Go action intent is invalid.');
        }

        $this->assertTrustedContextShape($context);
        $this->assertPayloadShape($payload);

        if (isset($context['company_id']) && trim((string) $context['company_id']) !== $companyId) {
            throw new InvalidArgumentException('Titan Go action context company_id does not match the trusted company boundary.');
        }
        if (isset($context['actor_id']) && trim((string) $context['actor_id']) !== $workerId) {
            throw new InvalidArgumentException('Titan Go action context actor_id does not match the trusted worker identity.');
        }

        $idempotencyKey = trim((string) ($context['idempotency_key'] ?? ''));
        if ($idempotencyKey === '' || strlen($idempotencyKey) > 190) {
            throw new InvalidArgumentException('Titan Go governed actions require a bounded idempotency_key.');
        }

        $trusted = [
            'company_id' => $companyId,
            'actor_id' => $workerId,
            'actor_type' => 'worker',
            'surface' => 'go',
            'source_surface' => 'go',
            'idempotency_key' => $idempotencyKey,
        ];

        foreach (['correlation_id', 'interaction_id', 'session_id', 'device_id'] as $key) {
            if (isset($context[$key]) && trim((string) $context[$key]) !== '') {
                $trusted[$key] = trim((string) $context[$key]);
            }
        }

        // Roles/scopes are accepted only from the trusted server-side context
        // passed to this adapter. They are never taken from the action payload.
        foreach (['roles', 'scopes', 'delegated_scopes', 'approval_evidence'] as $key) {
            if (array_key_exists($key, $context)) {
                $trusted[$key] = $context[$key];
            }
        }

        return $this->gateway->dispatch($intent, $payload, $trusted);
    }

    private function requiredIdentity(string $value, string $field): string
    {
        $value = trim($value);
        if ($value === '' || strlen($value) > 190) {
            throw new InvalidArgumentException('Titan Go requires a bounded '.$field.'.');
        }
        return $value;
    }

    private function assertTrustedContextShape(array $context): void
    {
        $nodes = 0;
        $this->assertTree($context, true, 0, $nodes);
    }

    private function assertPayloadShape(array $payload): void
    {
        $nodes = 0;
        $this->assertTree($payload, false, 0, $nodes);
    }

    private function assertTree(array $value, bool $context, int $depth, int &$nodes): void
    {
        if ($depth > self::MAX_DEPTH) {
            throw new InvalidArgumentException('Titan Go action data exceeds the maximum nesting depth.');
        }

        foreach ($value as $key => $item) {
            if (++$nodes > self::MAX_NODES) {
                throw new InvalidArgumentException('Titan Go action data exceeds the maximum safe size.');
            }

            $normal = is_string($key) ? strtolower((string) preg_replace('/[^a-z0-9]+/i', '', $key)) : '';
            if ($normal !== '') {
                if (in_array($normal, ['tenantid', 'tenantcompanyid', 'tenantscope', 'tenantboundary'], true)) {
                    throw new InvalidArgumentException('Titan Go accepts company_id as the sole tenant/company boundary.');
                }
                if (!$context && in_array($normal, [
                    'companyid', 'actorid', 'userid', 'roles', 'scopes', 'delegatedscopes',
                    'permissions', 'entitlements', 'autonomyauthority', 'approvalauthority',
                    'approvalevidence', 'providercredentials', 'credentials', 'accesstoken',
                    'refreshtoken', 'bearertoken', 'authorization',
                ], true)) {
                    throw new InvalidArgumentException('Titan Go action payload may not supply trusted authority context: '.$key);
                }
                if ($context && in_array($normal, self::FORBIDDEN_CONTEXT_KEYS, true)) {
                    throw new InvalidArgumentException('Titan Go action context contains forbidden authority or credential material: '.$key);
                }
            }

            if (is_array($item)) {
                $this->assertTree($item, $context, $depth + 1, $nodes);
                continue;
            }
            if (is_object($item) || is_resource($item)) {
                throw new InvalidArgumentException('Titan Go action data must be JSON-safe.');
            }
            if (is_string($item) && strlen($item) > 65535) {
                throw new InvalidArgumentException('Titan Go action data contains an oversized string value.');
            }
        }
    }
}
