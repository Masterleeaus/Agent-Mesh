<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Wizard\Validation;

final class BranchConditionEvaluator
{
    public function applies(array $field, array $data): bool
    {
        $condition = trim((string) ($field['branch_condition'] ?? ''));
        if ($condition === '') return true;

        if (preg_match('/^([A-Za-z0-9_.]+)\s*!=\s*(.+)$/', $condition, $m) === 1) {
            return !$this->equals($this->value($m[1], $field, $data), trim($m[2]));
        }
        if (preg_match('/^([A-Za-z0-9_.]+)\s*=\s*(.+)$/', $condition, $m) === 1) {
            return $this->equals($this->value($m[1], $field, $data), trim($m[2]));
        }
        if (preg_match('/^([A-Za-z0-9_.]+)\s+includes\s+(.+)$/i', $condition, $m) === 1) {
            return $this->includes($this->value($m[1], $field, $data), trim($m[2]));
        }

        $normalized = strtolower($condition);
        return match ($normalized) {
            'pricing model is not quote-only' => !in_array(strtolower((string) ($data['catalogue.pricing_model'] ?? '')), ['quote-only','quote_only','quote only'], true),
            'multiple branches or teams' => $this->truthy($data['business.branches'] ?? null),
            'external providers enabled', 'external provider marketplace enabled' => $this->containsAny($data['business.operating_model'] ?? null, ['external_provider','external providers','provider','contractor','contractors']),
            'social login selected' => $this->containsAny($data['login.methods'] ?? null, ['social','social_login']),
            'otp login or phone verification enabled' => $this->containsAny($data['login.methods'] ?? null, ['otp','otp_login']) || $this->containsAny($data['login.verification'] ?? null, ['phone','both']),
            'manual login enabled' => $this->containsAny($data['login.methods'] ?? null, ['manual','password','manual_login']),
            'customer portal enabled', 'public portal enabled' => array_key_exists('login.methods', $data) || $this->truthy($data['customer.guest_checkout'] ?? null),
            'byo ai selected' => $this->containsAny($data['ai.api_connection'] ?? null, ['byo','byo_ai','own','own_provider']),
            'maps needed and no host-managed provider' => $this->truthy($data['maps.connect'] ?? null),
            'company cloud storage selected' => $this->containsAny($data['storage.mode'] ?? null, ['company_cloud','cloud','company cloud']),
            'public website enabled' => $this->truthy($data['brand.public_site'] ?? null),
            default => true, // Preserve visibility for natural-language conditions that require host-derived state.
        };
    }

    private function value(string $key, array $field, array $data): mixed
    {
        if (array_key_exists($key, $data)) return $data[$key];
        if (!str_contains($key, '.')) {
            $id = (string) ($field['id'] ?? '');
            if (str_contains($id, '.')) {
                $prefix = strstr($id, '.', true);
                $candidate = $prefix . '.' . $key;
                if (array_key_exists($candidate, $data)) return $data[$candidate];
            }
            foreach ($data as $dataKey => $value) {
                if (is_string($dataKey) && str_ends_with($dataKey, '.' . $key)) return $value;
            }
        }
        return null;
    }

    private function equals(mixed $actual, string $expected): bool
    {
        if (is_bool($actual)) return $actual === $this->truthy($expected);
        return strtolower(trim((string) $actual)) === strtolower(trim($expected));
    }

    private function includes(mixed $actual, string $needle): bool
    {
        return $this->containsAny($actual, [$needle]);
    }

    private function containsAny(mixed $actual, array $needles): bool
    {
        $values = is_array($actual) ? $actual : [$actual];
        $values = array_map(static fn($v): string => strtolower(trim((string) $v)), $values);
        foreach ($needles as $needle) {
            $needle = strtolower(trim((string) $needle));
            foreach ($values as $value) {
                if ($value === $needle || str_contains($value, $needle)) return true;
            }
        }
        return false;
    }

    private function truthy(mixed $value): bool
    {
        if (is_bool($value)) return $value;
        if (is_int($value) || is_float($value)) return $value != 0;
        return in_array(strtolower(trim((string) $value)), ['1','true','yes','on','enabled'], true);
    }
}
