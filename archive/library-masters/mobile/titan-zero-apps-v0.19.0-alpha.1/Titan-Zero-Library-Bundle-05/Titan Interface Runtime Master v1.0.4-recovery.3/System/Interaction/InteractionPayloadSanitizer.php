<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Interaction;

final class InteractionPayloadSanitizer
{
    private const BLOCKED_KEYS = [
        'data', 'context', '_context', 'command', 'execution', 'executor', 'callback',
        'handler', 'callable', 'closure', 'sql', 'query_builder', 'model_class',
    ];

    /** @return array<string,mixed> */
    public function sanitizeStep(array $step): array
    {
        $value = $this->sanitizeValue($step, 0);
        return is_array($value) ? $value : [];
    }

    public function sanitizeValue(mixed $value, int $depth = 0): mixed
    {
        if ($depth > 12) return null;
        if ($value === null || is_bool($value) || is_int($value) || is_float($value)) return $value;
        if (is_string($value)) return substr($value, 0, 20000);
        if (! is_array($value)) return null;

        $out = [];
        foreach ($value as $key => $item) {
            $name = is_string($key) ? strtolower($key) : $key;
            if (is_string($name) && in_array($name, self::BLOCKED_KEYS, true)) continue;
            $sanitized = $this->sanitizeValue($item, $depth + 1);
            if ($sanitized === null && $item !== null) continue;
            $out[$key] = $sanitized;
            if (count($out) >= 500) break;
        }
        return $out;
    }
}
