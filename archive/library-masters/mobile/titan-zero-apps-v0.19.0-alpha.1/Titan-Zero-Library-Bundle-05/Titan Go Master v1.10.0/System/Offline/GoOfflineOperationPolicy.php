<?php

declare(strict_types=1);

namespace App\Extensions\TitanGo\System\Offline;

use InvalidArgumentException;

/** Keeps device-queued Go envelopes JSON-safe and prevents local audit metadata
 * from becoming an authority/credential side channel. Provider capability
 * implementations remain responsible for domain-specific payload validation.
 */
final class GoOfflineOperationPolicy
{
    private const MAX_DEPTH = 24;
    private const MAX_NODES = 20000;
    private const MAX_STRING_BYTES = 262144;

    private const FORBIDDEN_AUDIT_KEYS = [
        'credentials','credential','password','secret','accesstoken','refreshtoken',
        'bearertoken','authorization','providercredentials','permissions',
        'entitlements','autonomyauthority','approvalsignature','rawsql','sql',
        'tenantid','tenantcompanyid','tenantscope','tenantboundary',
    ];

    public function validate(GoOfflineOperation $operation): void
    {
        $nodes = 0;
        $this->assertJsonSafe($operation->payload, 'payload', 0, $nodes, false);
        $this->assertJsonSafe($operation->auditContext, 'audit_context', 0, $nodes, true);

        foreach ([$operation->companyId, $operation->actorId, $operation->deviceId, $operation->operationId] as $id) {
            if (strlen($id) > 255) {
                throw new InvalidArgumentException('Go offline identifiers must not exceed 255 bytes.');
            }
        }
    }

    private function assertJsonSafe(array $value, string $path, int $depth, int &$nodes, bool $audit): void
    {
        if ($depth > self::MAX_DEPTH) {
            throw new InvalidArgumentException('Go offline envelope exceeds the maximum nesting depth.');
        }

        foreach ($value as $key => $item) {
            $nodes++;
            if ($nodes > self::MAX_NODES) {
                throw new InvalidArgumentException('Go offline envelope exceeds the maximum safe size.');
            }

            if ($audit && is_string($key) && in_array($this->normalizeKey($key), self::FORBIDDEN_AUDIT_KEYS, true)) {
                throw new InvalidArgumentException('Authority or credential material is forbidden in Go offline audit context: '.$path.'.'.$key);
            }

            if (is_array($item)) {
                $this->assertJsonSafe($item, $path.'.'.(string)$key, $depth + 1, $nodes, $audit);
                continue;
            }
            if (is_object($item) || is_resource($item)) {
                throw new InvalidArgumentException('Go offline envelopes must contain JSON-safe scalar or array values only: '.$path.'.'.(string)$key);
            }
            if (is_string($item) && strlen($item) > self::MAX_STRING_BYTES) {
                throw new InvalidArgumentException('Go offline envelope string exceeds the maximum safe size: '.$path.'.'.(string)$key);
            }
        }
    }

    private function normalizeKey(string $key): string
    {
        return strtolower((string) preg_replace('/[^a-z0-9]+/i', '', trim($key)));
    }
}
