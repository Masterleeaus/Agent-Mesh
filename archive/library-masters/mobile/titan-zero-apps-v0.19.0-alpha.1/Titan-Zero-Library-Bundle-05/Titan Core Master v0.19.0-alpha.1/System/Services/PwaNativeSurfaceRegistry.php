<?php

declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Services;

/**
 * Canonical Pass-12 decision layer for native PWA surfaces.
 *
 * It does not execute provider actions and it does not grant authority. It only
 * answers where an already-authorised capability should be presented.
 */
final class PwaNativeSurfaceRegistry
{
    public const NATIVE_REQUIRED = 'native_required';
    public const NATIVE_PLUS_ADVANCED_FALLBACK = 'native_plus_advanced_fallback';
    public const ADMIN_ONLY = 'admin_only';
    public const ROLE_UNAVAILABLE = 'role_unavailable';

    public function __construct(
        private readonly TitanAppsModuleLibrary $library,
        private readonly AppSurfaceAudienceResolver $audiences,
    ) {}

    /** @return array<string,mixed> */
    public function decision(string $botType, string $module): array
    {
        $botType = $this->audiences->catalogueAudience($botType);
        $definition = $this->library->definition($module);
        $variant = $definition === null ? null : $this->library->roleVariant($module, $botType);

        if ($definition === null || $variant === null) {
            return $this->payload($botType, $module, self::ROLE_UNAVAILABLE, '', false, 'Module is not available to this app/role.');
        }

        $classification = $this->configuredClassification($botType, $module);
        if ($classification === null) {
            $view = trim((string) ($definition['view'] ?? 'module'));
            $route = trim((string) (($definition['routes'] ?? [])[$botType] ?? ''));
            if ($view === 'platform') {
                $classification = self::ADMIN_ONLY;
            } elseif ($route !== '' && str_starts_with($route, '/dashboard/')) {
                $classification = self::NATIVE_PLUS_ADVANCED_FALLBACK;
            } else {
                $classification = self::NATIVE_REQUIRED;
            }
        }

        $route = trim((string) (($definition['routes'] ?? [])[$botType] ?? ''));
        $fallback = $classification === self::NATIVE_PLUS_ADVANCED_FALLBACK || $classification === self::ADMIN_ONLY;

        return $this->payload(
            $botType,
            (string) ($definition['id'] ?? $module),
            $classification,
            $fallback ? $route : '',
            $fallback && $route !== '',
            $this->reasonFor($classification),
        );
    }

    public function classification(string $botType, string $module): string
    {
        return (string) $this->decision($botType, $module)['classification'];
    }

    public function advancedFallbackAllowed(string $botType, string $module): bool
    {
        return (bool) $this->decision($botType, $module)['advanced_fallback_allowed'];
    }

    public function advancedFallbackRoute(string $botType, string $module): string
    {
        return (string) $this->decision($botType, $module)['platform_route'];
    }

    public function providerFor(string $module): string
    {
        return trim((string) config('titan-apps-core.pwa_surface_providers.' . $module, 'Titan Provider'));
    }

    /** @return array<string,array<string,mixed>> */
    public function inventoryFor(string $botType): array
    {
        $result = [];
        foreach ($this->library->catalog() as $id => $_definition) {
            $decision = $this->decision($botType, (string) $id);
            if ($decision['classification'] === self::ROLE_UNAVAILABLE) {
                continue;
            }
            $result[(string) $id] = $decision;
        }

        return $result;
    }

    private function configuredClassification(string $botType, string $module): ?string
    {
        $policy = (array) config('titan-apps-core.pwa_native_surface_policy', []);
        foreach ([self::NATIVE_REQUIRED, self::NATIVE_PLUS_ADVANCED_FALLBACK, self::ADMIN_ONLY] as $classification) {
            $ids = array_map('strval', (array) (($policy[$classification] ?? [])[$botType] ?? []));
            if (in_array($module, $ids, true)) {
                return $classification;
            }
        }

        return null;
    }

    /** @return array<string,mixed> */
    private function payload(string $botType, string $module, string $classification, string $route, bool $fallback, string $reason): array
    {
        return [
            'app' => $botType,
            'module' => $module,
            'classification' => $classification,
            'native_view' => $classification !== self::ADMIN_ONLY && $classification !== self::ROLE_UNAVAILABLE ? 'app-module' : '',
            'platform_route' => $route,
            'advanced_fallback_allowed' => $fallback,
            'provider' => $this->providerFor($module),
            'reason' => $reason,
        ];
    }

    private function reasonFor(string $classification): string
    {
        return match ($classification) {
            self::NATIVE_REQUIRED => 'Ordinary workflow must remain inside the app-native PWA surface.',
            self::NATIVE_PLUS_ADVANCED_FALLBACK => 'Use the native PWA surface by default; provider dashboard is an explicit advanced fallback only.',
            self::ADMIN_ONLY => 'Administrative provider surface; not an ordinary PWA workflow.',
            default => 'Unavailable for this app/role.',
        };
    }

}
