<?php

declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Services;

/**
 * Canonical shared app-module library for Titan Zero, Titan Go and Titan Hub.
 *
 * The raw config remains the authoring source, but every runtime/Builder consumer
 * receives the same normalized definitions from this service. This prevents
 * Builder, PWA navigation and API module catalogs from drifting independently.
 */
final class TitanAppsModuleLibrary
{
    public function __construct(private readonly TitanAppsRolePolicyService $rolePolicy)
    {
    }

    /** @return array<string,array<string,mixed>> */
    public function catalog(): array
    {
        $catalog = [];
        foreach ((array) config('titan-apps-core.app_modules', []) as $id => $definition) {
            if (! is_string($id) || $id === '' || ! is_array($definition)) {
                continue;
            }

            $roles = array_values(array_unique(array_filter(
                array_map('strval', (array) ($definition['roles'] ?? [])),
                fn (string $role): bool => in_array($role, ['customer', 'business', 'worker'], true)
            )));

            $view = trim((string) ($definition['view'] ?? 'module'));
            if (! in_array($view, ['module', 'welcome', 'conversations-list', 'articles-list', 'settings', 'platform'], true)) {
                $view = 'module';
            }

            $groups = [];
            $roleVariants = [];
            foreach ($roles as $role) {
                $groups[$role] = $this->groupFor($role, $id);
                $variant = $this->rolePolicy->variantFor($id, $role, $definition);
                if ($variant !== null) {
                    $roleVariants[$role] = $variant;
                }
            }

            $catalog[$id] = [
                'id' => $id,
                'label' => trim((string) ($definition['label'] ?? $id)),
                'icon' => trim((string) ($definition['icon'] ?? '•')),
                'roles' => $roles,
                'groups' => $groups,
                'role_variants' => $roleVariants,
                'pattern' => $this->patternFor($id),
                'view' => $view,
                'routes' => is_array($definition['routes'] ?? null) ? $definition['routes'] : [],
                'permission' => trim((string) ($definition['permission'] ?? '')),
                'donor' => is_array($definition['donor'] ?? null) ? $definition['donor'] : [],
                'renderable' => $view === 'module',
            ] + $definition;
        }

        return $catalog;
    }

    /** @return array<string,mixed>|null */
    public function definition(string $module): ?array
    {
        $module = $this->resolveAlias($module);
        $definition = $this->catalog()[$module] ?? null;

        return is_array($definition) ? $definition : null;
    }

    /** @return array<string,mixed>|null */
    public function roleVariant(string $module, string $botType): ?array
    {
        $definition = $this->definition($module);
        if ($definition === null) {
            return null;
        }

        return $this->rolePolicy->variantFor((string) ($definition['id'] ?? $module), $botType, $definition);
    }

    /** @return array<string,array<string,mixed>> */
    public function catalogFor(string $botType): array
    {
        $result = [];
        foreach ($this->availableFor($botType) as $definition) {
            $id = (string) ($definition['id'] ?? '');
            if ($id === '') {
                continue;
            }
            unset($definition['role_variants']);
            $result[$id] = $definition;
        }

        return $result;
    }

    /** @return list<array<string,mixed>> */
    public function availableFor(string $botType): array
    {
        $botType = $this->normalizeBotType($botType);
        $result = [];

        foreach ($this->catalog() as $definition) {
            if (! in_array($botType, (array) ($definition['roles'] ?? []), true)) {
                continue;
            }
            $variant = $this->rolePolicy->variantFor((string) ($definition['id'] ?? ''), $botType, $definition);
            if ($variant === null) {
                continue;
            }
            $definition['group'] = (string) (($definition['groups'] ?? [])[$botType] ?? 'More');
            $definition['role_variant'] = $variant;
            $result[] = $definition;
        }

        return $result;
    }

    /** @return list<string> */
    public function renderableIds(): array
    {
        return array_values(array_map(
            fn (array $definition): string => (string) $definition['id'],
            array_filter($this->catalog(), fn (array $definition): bool => (bool) ($definition['renderable'] ?? false))
        ));
    }

    public function patternFor(string $module): string
    {
        $module = $this->resolveAlias($module);
        foreach ((array) config('titan-apps-core.app_module_patterns', []) as $pattern => $ids) {
            if (in_array($module, array_map('strval', (array) $ids), true)) {
                return (string) $pattern;
            }
        }

        return 'dashboard';
    }

    public function groupFor(string $botType, string $module): string
    {
        $botType = $this->normalizeBotType($botType);
        $module = $this->resolveAlias($module);

        foreach ((array) config('titan-apps-core.app_module_groups.' . $botType, []) as $group => $ids) {
            if (in_array($module, array_map('strval', (array) $ids), true)) {
                return (string) $group;
            }
        }

        return 'More';
    }

    /** @return list<string> */
    public function navigationDefaults(string $botType): array
    {
        return $this->filterDefaultIds($botType, (array) config('titan-apps-core.app_navigation_defaults.' . $this->normalizeBotType($botType), []));
    }

    /** @return list<string> */
    public function footerDefaults(string $botType): array
    {
        return array_slice($this->filterDefaultIds($botType, (array) config('titan-apps-core.app_footer_defaults.' . $this->normalizeBotType($botType), [])), 0, 5);
    }

    /** @return array<string,list<string>> */
    public function allNavigationDefaults(): array
    {
        return [
            'customer' => $this->navigationDefaults('customer'),
            'business' => $this->navigationDefaults('business'),
            'worker' => $this->navigationDefaults('worker'),
        ];
    }

    /** @return array<string,list<string>> */
    public function allFooterDefaults(): array
    {
        return [
            'customer' => $this->footerDefaults('customer'),
            'business' => $this->footerDefaults('business'),
            'worker' => $this->footerDefaults('worker'),
        ];
    }

    /** @return list<string> */
    public function validate(): array
    {
        $errors = [];
        $catalog = $this->catalog();
        $required = array_map('strval', (array) config('titan-apps-core.app_module_contract.required', []));

        foreach ($required as $module) {
            $canonical = $this->resolveAlias($module);
            if (! isset($catalog[$canonical])) {
                $errors[] = "Required app module [{$module}] is missing.";
            }
        }

        foreach ($catalog as $id => $definition) {
            if (($definition['label'] ?? '') === '') {
                $errors[] = "App module [{$id}] has no label.";
            }
            if ((array) ($definition['roles'] ?? []) === []) {
                $errors[] = "App module [{$id}] has no allowed roles.";
            }
            // Core validates semantic module contracts only. Concrete views/components are
            // owned by Zero/Go/Hub, Builder and Interface Runtime rather than Core.
            foreach ((array) ($definition['roles'] ?? []) as $role) {
                if ($this->groupFor((string) $role, (string) $id) === 'More') {
                    $errors[] = "App module [{$id}] is not grouped for role [{$role}].";
                }
            }
        }

        foreach ($this->rolePolicy->validate($catalog) as $policyError) {
            $errors[] = $policyError;
        }

        foreach (['customer', 'business', 'worker'] as $role) {
            $expected = $role === 'business' ? 4 : 5;
            if (count($this->footerDefaults($role)) !== $expected) {
                $errors[] = "Role [{$role}] must have exactly {$expected} valid footer defaults.";
            }
        }

        return $errors;
    }

    private function resolveAlias(string $module): string
    {
        $module = trim($module);
        $aliases = (array) config('titan-apps-core.app_module_contract.aliases', []);

        return trim((string) ($aliases[$module] ?? $module));
    }

    /** @param list<mixed> $ids @return list<string> */
    private function filterDefaultIds(string $botType, array $ids): array
    {
        $botType = $this->normalizeBotType($botType);
        $result = [];

        foreach ($ids as $id) {
            $id = $this->resolveAlias((string) $id);
            $definition = $this->definition($id);
            if (! $definition || $this->roleVariant($id, $botType) === null) {
                continue;
            }
            if (! in_array($id, $result, true)) {
                $result[] = $id;
            }
        }

        return $result;
    }

    private function normalizeBotType(string $botType): string
    {
        return match (strtolower(trim($botType))) {
            'zero','bos','command','owner','manager','business' => 'business',
            'go','field','worker' => 'worker',
            'hub','customer' => 'customer',
            default => 'customer',
        };
    }
}
