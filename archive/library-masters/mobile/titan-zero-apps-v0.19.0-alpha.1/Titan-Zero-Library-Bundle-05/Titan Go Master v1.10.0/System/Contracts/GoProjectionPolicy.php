<?php

declare(strict_types=1);

namespace App\Extensions\TitanGo\System\Contracts;

use InvalidArgumentException;

/**
 * Enforces the worker-safe projection boundary before provider data reaches Go UI.
 * Domain providers decide the projection contents; Go only verifies that the
 * envelope is explicitly Go-scoped, JSON-safe, bounded, and does not contain
 * raw/authority-bearing structures that presentation code must never receive.
 */
final class GoProjectionPolicy
{
    private const MAX_DEPTH = 24;
    private const MAX_NODES = 10000;

    /** @var list<string> normalized with non-alphanumeric characters removed */
    private const FORBIDDEN_KEYS = [
        'rawrecord', 'rawrecords', 'rawmodel', 'eloquentmodel', 'databaserecord',
        'databaserow', 'rawfields', 'rawsql', 'sql', 'query', 'credentials',
        'password', 'secret', 'accesstoken', 'refreshtoken', 'bearertoken',
        'authorization', 'permissions', 'entitlements', 'autonomyauthority',
        'providercredentials',
    ];

    public static function assertProjection(array $projection): void
    {
        if (($projection['surface'] ?? 'go') !== 'go') {
            throw new InvalidArgumentException('Titan Go accepts only worker-safe Go projections.');
        }

        $nodes = 0;
        self::assertSafeTree($projection, 'projection', 0, $nodes);
    }

    private static function assertSafeTree(array $value, string $path, int $depth, int &$nodes): void
    {
        if ($depth > self::MAX_DEPTH) {
            throw new InvalidArgumentException('Titan Go projection exceeds the maximum nesting depth.');
        }

        foreach ($value as $key => $item) {
            $nodes++;
            if ($nodes > self::MAX_NODES) {
                throw new InvalidArgumentException('Titan Go projection exceeds the maximum safe size.');
            }

            $keyName = is_string($key) ? self::normalizeKey($key) : '';
            if ($keyName !== '' && in_array($keyName, self::FORBIDDEN_KEYS, true)) {
                throw new InvalidArgumentException('Forbidden raw or authority-bearing Go projection field: '.$path.'.'.$key);
            }

            if (is_array($item)) {
                self::assertSafeTree($item, $path.'.'.(string)$key, $depth + 1, $nodes);
                continue;
            }

            if (is_object($item) || is_resource($item)) {
                throw new InvalidArgumentException('Titan Go projections must contain JSON-safe scalar or array values only: '.$path.'.'.$key);
            }
        }
    }

    private static function normalizeKey(string $key): string
    {
        return strtolower((string) preg_replace('/[^a-z0-9]+/i', '', trim($key)));
    }
}
