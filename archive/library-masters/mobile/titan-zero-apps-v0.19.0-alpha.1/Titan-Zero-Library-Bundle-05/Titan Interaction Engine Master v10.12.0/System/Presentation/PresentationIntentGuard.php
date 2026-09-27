<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Presentation;

use InvalidArgumentException;

/**
 * Fail-closed validation for the AI/interaction -> Interface Runtime handoff.
 * The guard validates metadata only; component existence/action authority remain
 * the responsibility of Interface Runtime and the governed capability gateway.
 */
final class PresentationIntentGuard
{
    private const IDENTIFIER = '/^[a-z0-9][a-z0-9._:-]{0,127}$/i';
    private const MAX_DEPTH = 24;
    private const MAX_NODES = 10000;
    private const MAX_STRING_BYTES = 65536;

    /** @var list<string> keys normalized to lowercase alphanumerics */
    private const FORBIDDEN_KEYS = [
        'javascript', 'script', 'eval', 'rawhtml', 'html', 'blade', 'react', 'vue',
        'rawcss', 'css', 'rawsql', 'sql', 'credentials', 'credential', 'password',
        'secret', 'authorization', 'bearertoken', 'accesstoken', 'refreshtoken',
        'destructiveurl', 'providercredentials', 'permissions', 'entitlements',
        'autonomyauthority',
    ];

    public function validate(
        array $semanticComponents,
        array $dataRequirements,
        array $visualHints,
        array $actions
    ): void {
        foreach ($semanticComponents as $component) {
            if (!is_string($component) || !$this->validIdentifier($component)) {
                throw new InvalidArgumentException('Presentation semantic components must be governed identifiers.');
            }
        }

        $nodes = 0;
        foreach ($dataRequirements as $requirement) {
            if (is_string($requirement)) {
                if (!$this->validIdentifier($requirement)) {
                    throw new InvalidArgumentException('Presentation data requirements must be governed identifiers.');
                }
                continue;
            }
            if (!is_array($requirement)) {
                throw new InvalidArgumentException('Presentation data requirements must be identifiers or structured metadata.');
            }
            $this->assertSafeMetadata($requirement, 'data_requirement', 0, $nodes);
        }

        $this->assertSafeMetadata($visualHints, 'visual_hints', 0, $nodes);

        foreach ($actions as $action) {
            if (!is_array($action) || !isset($action['intent']) || !$this->validIdentifier((string)$action['intent'])) {
                throw new InvalidArgumentException('Presentation actions must be governed intent identifiers.');
            }
            $this->assertSafeMetadata($action, 'action', 0, $nodes);
        }
    }

    private function validIdentifier(string $value): bool
    {
        return preg_match(self::IDENTIFIER, trim($value)) === 1;
    }

    private function assertSafeMetadata(array $value, string $path, int $depth, int &$nodes): void
    {
        if ($depth > self::MAX_DEPTH) {
            throw new InvalidArgumentException('Presentation metadata exceeds the maximum nesting depth.');
        }

        foreach ($value as $key => $item) {
            $nodes++;
            if ($nodes > self::MAX_NODES) {
                throw new InvalidArgumentException('Presentation metadata exceeds the maximum safe size.');
            }

            if (is_string($key)) {
                $normalized = $this->normalizeKey($key);
                if (in_array($normalized, self::FORBIDDEN_KEYS, true)) {
                    throw new InvalidArgumentException('Executable or authority-bearing presentation metadata is forbidden: '.$path.'.'.$key);
                }
            }

            if (is_array($item)) {
                $this->assertSafeMetadata($item, $path.'.'.(string)$key, $depth + 1, $nodes);
                continue;
            }

            if (is_object($item) || is_resource($item)) {
                throw new InvalidArgumentException('Presentation metadata must be JSON-safe scalar or array values only: '.$path.'.'.(string)$key);
            }

            if (is_string($item)) {
                $this->assertSafeString($item, $path.'.'.(string)$key);
            }
        }
    }

    private function assertSafeString(string $value, string $path): void
    {
        if (strlen($value) > self::MAX_STRING_BYTES) {
            throw new InvalidArgumentException('Presentation metadata string exceeds the maximum safe size: '.$path);
        }

        $trimmed = ltrim($value);
        if (preg_match('/^(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/i', $trimmed) === 1) {
            throw new InvalidArgumentException('Executable presentation URI is forbidden: '.$path);
        }
        if (preg_match('/<\s*\/?\s*(?:script|iframe|object|embed|style|link|meta)\b/i', $value) === 1) {
            throw new InvalidArgumentException('Executable presentation markup is forbidden: '.$path);
        }
    }

    private function normalizeKey(string $key): string
    {
        return strtolower((string) preg_replace('/[^a-z0-9]+/i', '', trim($key)));
    }
}
