<?php

declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Services;

/**
 * Fail-closed role policy for shared Titan Apps modules.
 *
 * Titan Zero, Titan Go and Titan Hub share presentation components, but never
 * implicitly share data scope or actions. Every allowed module/role pair must
 * map to an explicit action profile in config/chatbot.php.
 */
final class TitanAppsRolePolicyService
{
    public function __construct(private readonly AppSurfaceAudienceResolver $audiences) {}

    /** @return array<string,mixed>|null */
    public function variantFor(string $module, string $botType, array $definition = []): ?array
    {
        $botType = $this->audiences->catalogueAudience($botType);
        $policy = (array) config('titan-apps-core.app_role_policies.' . $botType, []);
        $moduleProfiles = (array) ($policy['module_profiles'] ?? []);
        $profileName = trim((string) ($moduleProfiles[$module] ?? ''));

        // Missing explicit mapping is a deny, even if a menu definition lists the role.
        if ($profileName === '') {
            return null;
        }

        $profile = (array) config('titan-apps-core.app_action_profiles.' . $profileName, []);
        if ($profile === []) {
            return null;
        }

        $declaredRoles = array_map('strval', (array) ($definition['roles'] ?? []));
        if ($declaredRoles !== [] && ! in_array($botType, $declaredRoles, true)) {
            return null;
        }

        $actions = array_values(array_unique(array_filter(
            array_map('strval', (array) ($profile['actions'] ?? [])),
            static fn (string $action): bool => trim($action) !== ''
        )));

        return [
            'bot_type' => $botType,
            'product' => match ($botType) {
                'business' => 'Titan Zero',
                'worker' => 'Titan Go',
                default => 'Titan Hub',
            },
            'audience' => trim((string) ($policy['audience'] ?? $botType)),
            'objective' => trim((string) ($policy['objective'] ?? '')),
            'data_scope' => trim((string) ($policy['data_scope'] ?? 'deny')),
            'resource_scope' => trim((string) ($profile['resource_scope'] ?? 'deny')),
            'action_profile' => $profileName,
            'actions' => $actions,
            'read_only' => count(array_diff($actions, ['view','search','ask_ai','download','navigate','mark_read'])) === 0,
        ];
    }

    public function allowsModule(string $module, string $botType, array $definition = []): bool
    {
        return $this->variantFor($module, $botType, $definition) !== null;
    }

    public function allowsAction(string $module, string $botType, string $action, array $definition = []): bool
    {
        $variant = $this->variantFor($module, $botType, $definition);
        if ($variant === null) {
            return false;
        }

        return in_array(trim($action), (array) ($variant['actions'] ?? []), true);
    }

    /** @param array<string,array<string,mixed>> $catalog @return list<string> */
    public function validate(array $catalog): array
    {
        $errors = [];
        $policies = (array) config('titan-apps-core.app_role_policies', []);

        foreach (['customer','business','worker'] as $role) {
            $mapping = (array) (($policies[$role] ?? [])['module_profiles'] ?? []);
            foreach ($catalog as $id => $definition) {
                $allowed = in_array($role, array_map('strval', (array) ($definition['roles'] ?? [])), true);
                $mapped = isset($mapping[$id]) && trim((string) $mapping[$id]) !== '';
                if ($allowed && ! $mapped) {
                    $errors[] = "Module [{$id}] allows role [{$role}] but has no explicit role variant.";
                }
                if (! $allowed && $mapped) {
                    $errors[] = "Module [{$id}] maps role [{$role}] even though the catalog forbids it.";
                }
                if ($allowed && $this->variantFor((string) $id, $role, $definition) === null) {
                    $errors[] = "Module [{$id}] role [{$role}] resolves to a denied/missing action profile.";
                }
            }
        }

        return $errors;
    }

}
