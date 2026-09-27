<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Settings;

/**
 * Allowlists user-editable Interaction Engine settings.
 * Secrets, company identity and capability authority are intentionally absent.
 */
final class SettingsPolicy
{
    /** @return array<string,mixed> */
    public function sanitizePlatform(array $input): array
    {
        return $this->sanitize($input, [
            'enabled' => ['bool'],
            'default_renderer' => ['enum', ['hybrid', 'conversational', 'structured']],
            'local_intelligence_enabled' => ['bool'],
            'local_minimum_confidence' => ['float', 0.0, 1.0],
            'offline_enabled' => ['bool'],
            'cache_ttl' => ['int', 60, 86400],
            'fresh_authentication_seconds' => ['int', 60, 3600],
            'sync_batch_size' => ['int', 1, 500],
        ]);
    }

    /** @return array<string,mixed> */
    public function sanitizeCompany(array $input): array
    {
        return $this->sanitize($input, [
            'default_renderer' => ['enum', ['hybrid', 'conversational', 'structured']],
            'local_intelligence_enabled' => ['bool'],
            'offline_enabled' => ['bool'],
            'interaction_style' => ['enum', ['hybrid', 'conversational', 'structured']],
            'offline_behavior' => ['enum', ['auto', 'offline_first', 'online_first']],
            'show_progress' => ['bool'],
        ]);
    }

    /** @return array<string,mixed> */
    public function sanitizeUser(array $input): array
    {
        return $this->sanitize($input, [
            'interaction_style' => ['enum', ['inherit', 'hybrid', 'conversational', 'structured']],
            'guidance_detail' => ['enum', ['concise', 'balanced', 'detailed']],
            'local_guidance_enabled' => ['bool'],
            'offline_preference' => ['enum', ['inherit', 'auto', 'offline_first', 'online_first']],
            'show_progress' => ['bool'],
        ]);
    }

    /** @return array<string,mixed> */
    private function sanitize(array $input, array $rules): array
    {
        $clean = [];
        foreach ($rules as $key => $rule) {
            if (!array_key_exists($key, $input)) continue;
            $value = $input[$key];
            $type = $rule[0];
            if ($type === 'bool') {
                $normalized = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                if ($normalized !== null) $clean[$key] = $normalized;
                continue;
            }
            if ($type === 'enum') {
                $candidate = trim((string) $value);
                if (in_array($candidate, $rule[1], true)) $clean[$key] = $candidate;
                continue;
            }
            if ($type === 'int' && is_numeric($value)) {
                $candidate = (int) $value;
                if ($candidate >= $rule[1] && $candidate <= $rule[2]) $clean[$key] = $candidate;
                continue;
            }
            if ($type === 'float' && is_numeric($value)) {
                $candidate = (float) $value;
                if ($candidate >= $rule[1] && $candidate <= $rule[2]) $clean[$key] = $candidate;
            }
        }
        return $clean;
    }
}
