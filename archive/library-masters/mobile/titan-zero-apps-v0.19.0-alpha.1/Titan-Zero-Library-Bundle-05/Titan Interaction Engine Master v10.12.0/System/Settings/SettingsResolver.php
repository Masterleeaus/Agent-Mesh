<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Settings;

final class SettingsResolver
{
    public function __construct(private readonly SettingsRepository $repository) {}

    public function platform(string $key, mixed $default = null): mixed
    {
        $stored = $this->repository->platform($key);
        return $stored ?? $default ?? $this->configDefault($key);
    }

    public function platformBool(string $key, bool $default): bool { return (bool) $this->platform($key, $default); }
    public function platformInt(string $key, int $default): int { return (int) $this->platform($key, $default); }
    public function platformFloat(string $key, float $default): float { return (float) $this->platform($key, $default); }

    public function company(string $companyId, string $key, mixed $default = null): mixed
    {
        $stored = $this->repository->company($companyId, $key);
        return $stored ?? $this->platform($key, $default);
    }

    public function companyBool(string $companyId, string $key, bool $default): bool { return (bool) $this->company($companyId, $key, $default); }

    public function user(string $companyId, int|string $userId, string $key, mixed $default = null): mixed
    {
        $preferences = $this->repository->userAll($companyId, $userId);
        $value = $preferences[$key] ?? null;
        if ($value === 'inherit') $value = null;
        return $value ?? $this->company($companyId, $this->companyKeyForUserPreference($key), $default);
    }

    /** @return array<string,mixed> */
    public function platformSnapshot(): array
    {
        $stored = $this->repository->platformAll();
        return [
            'enabled' => (bool) ($stored['enabled'] ?? config('interaction-engine.enabled', true)),
            'default_renderer' => (string) ($stored['default_renderer'] ?? config('interaction-engine.wizard.default_renderer', 'hybrid')),
            'local_intelligence_enabled' => (bool) ($stored['local_intelligence_enabled'] ?? config('interaction-engine.local_intelligence.enabled', true)),
            'local_minimum_confidence' => (float) ($stored['local_minimum_confidence'] ?? config('interaction-engine.local_intelligence.minimum_confidence', 0.65)),
            'offline_enabled' => (bool) ($stored['offline_enabled'] ?? config('interaction-engine.offline.enabled', true)),
            'cache_ttl' => (int) ($stored['cache_ttl'] ?? config('interaction-engine.cache_ttl', 3600)),
            'fresh_authentication_seconds' => (int) ($stored['fresh_authentication_seconds'] ?? config('interaction-engine.authority.fresh_authentication_seconds', 300)),
            'sync_batch_size' => (int) ($stored['sync_batch_size'] ?? config('interaction-engine.offline.sync_batch_size', 100)),
        ];
    }

    /** @return array<string,mixed> */
    public function companySnapshot(string $companyId): array
    {
        $stored = $this->repository->companyAll($companyId);
        $platform = $this->platformSnapshot();
        return [
            'default_renderer' => (string) ($stored['default_renderer'] ?? $platform['default_renderer']),
            'local_intelligence_enabled' => (bool) ($stored['local_intelligence_enabled'] ?? $platform['local_intelligence_enabled']),
            'offline_enabled' => (bool) ($stored['offline_enabled'] ?? $platform['offline_enabled']),
            'interaction_style' => (string) ($stored['interaction_style'] ?? 'hybrid'),
            'offline_behavior' => (string) ($stored['offline_behavior'] ?? 'auto'),
            'show_progress' => (bool) ($stored['show_progress'] ?? true),
        ];
    }

    /** @return array<string,mixed> */
    public function userSnapshot(string $companyId, int|string $userId): array
    {
        $stored = $this->repository->userAll($companyId, $userId);
        return [
            'interaction_style' => $stored['interaction_style'] ?? 'inherit',
            'guidance_detail' => $stored['guidance_detail'] ?? 'balanced',
            'local_guidance_enabled' => (bool) ($stored['local_guidance_enabled'] ?? true),
            'offline_preference' => $stored['offline_preference'] ?? 'inherit',
            'show_progress' => (bool) ($stored['show_progress'] ?? true),
        ];
    }

    /** @return array<string,mixed> */
    public function presentationSnapshot(string $companyId, int|string $userId): array
    {
        $company = $this->companySnapshot($companyId);
        $stored = $this->repository->userAll($companyId, $userId);
        $style = ($stored['interaction_style'] ?? 'inherit') === 'inherit'
            ? (string) $company['interaction_style']
            : (string) $stored['interaction_style'];
        $offline = ($stored['offline_preference'] ?? 'inherit') === 'inherit'
            ? (string) $company['offline_behavior']
            : (string) $stored['offline_preference'];

        return [
            'renderer' => (string) $company['default_renderer'],
            'interaction_style' => $style,
            'guidance_detail' => (string) ($stored['guidance_detail'] ?? 'balanced'),
            'local_guidance_enabled' => (bool) ($stored['local_guidance_enabled'] ?? true) && (bool) $company['local_intelligence_enabled'],
            'offline_enabled' => (bool) $company['offline_enabled'],
            'offline_behavior' => (bool) $company['offline_enabled'] ? $offline : 'online_only',
            'show_progress' => array_key_exists('show_progress', $stored) ? (bool) $stored['show_progress'] : (bool) $company['show_progress'],
        ];
    }

    /** Never returns secret values. */
    public function secretStatus(): array
    {
        return [
            'approval_secret' => ['configured' => $this->configured((string) config('interaction-engine.authority.approval_secret', ''), 16)],
            'outbox_secret' => ['configured' => $this->configured((string) config('interaction-engine.wizard.outbox_secret', ''))],
        ];
    }

    private function configured(string $value, int $minimumLength = 1): bool
    {
        $normalized = trim($value);
        return strlen($normalized) >= $minimumLength && !str_contains(strtolower($normalized), 'change-me');
    }

    private function configDefault(string $key): mixed
    {
        return match ($key) {
            'enabled' => config('interaction-engine.enabled', true),
            'default_renderer' => config('interaction-engine.wizard.default_renderer', 'hybrid'),
            'local_intelligence_enabled' => config('interaction-engine.local_intelligence.enabled', true),
            'local_minimum_confidence' => config('interaction-engine.local_intelligence.minimum_confidence', 0.65),
            'offline_enabled' => config('interaction-engine.offline.enabled', true),
            'cache_ttl' => config('interaction-engine.cache_ttl', 3600),
            'fresh_authentication_seconds' => config('interaction-engine.authority.fresh_authentication_seconds', 300),
            'sync_batch_size' => config('interaction-engine.offline.sync_batch_size', 100),
            default => null,
        };
    }

    private function companyKeyForUserPreference(string $key): string
    {
        return match ($key) {
            'offline_preference' => 'offline_behavior',
            default => $key,
        };
    }
}
