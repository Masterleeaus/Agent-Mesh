<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Security;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;

/** Source surface is audit context only; permissions come from the authenticated actor. */
final class BuilderAuthorization
{
    public function __construct(private readonly Request $request) {}

    /** @throws AuthorizationException */
    public function require(string $capability): void
    {
        if (! $this->allows($capability)) {
            throw new AuthorizationException('Titan Builder actor lacks capability: '.$capability);
        }
    }

    public function allows(string $capability): bool
    {
        $user = $this->request->user();
        if (! is_object($user)) {
            return false;
        }

        // Native host authorization is authoritative whenever it grants the ability.
        if (method_exists($user, 'can') && $user->can($capability)) {
            return true;
        }

        return in_array($capability, $this->legacyActorDefaults($user), true);
    }

    /** @return array<int,string> */
    private function legacyActorDefaults(object $user): array
    {
        if (config('titan-builder.authorization.legacy_actor_fallback', true) !== true) {
            return [];
        }

        $defaults = (array) config('titan-builder.authorization.legacy_actor_defaults', [
            'user' => ['builder.read', 'builder.edit', 'builder.publish', 'builder.assets.manage', 'builder.templates.manage'],
            'admin' => ['builder.read', 'builder.edit', 'builder.publish', 'builder.assets.manage', 'builder.templates.manage', 'builder.admin'],
            'super_admin' => ['builder.read', 'builder.edit', 'builder.publish', 'builder.assets.manage', 'builder.templates.manage', 'builder.admin'],
        ]);

        $classifications = [];
        $type = $user->type ?? null;
        if (is_string($type) && trim($type) !== '') {
            $classifications[] = strtolower(trim($type));
        }

        // Some MagicAI versions attach Spatie roles; others only set users.type.
        if (method_exists($user, 'getRoleNames')) {
            try {
                $roleNames = $user->getRoleNames();
                if (is_object($roleNames) && method_exists($roleNames, 'all')) {
                    $roleNames = $roleNames->all();
                }
                if (is_iterable($roleNames)) {
                    foreach ($roleNames as $role) {
                        if (is_string($role) && trim($role) !== '') {
                            $classifications[] = strtolower(trim($role));
                        }
                    }
                }
            } catch (\Throwable) {
                // Host role package is optional for this compatibility path.
            }
        }

        $abilities = [];
        foreach (array_values(array_unique($classifications)) as $classification) {
            foreach ((array) ($defaults[$classification] ?? []) as $ability) {
                if (is_string($ability) && str_starts_with($ability, 'builder.')) {
                    $abilities[$ability] = true;
                }
            }
        }

        return array_keys($abilities);
    }

    public function auditContext(): array
    {
        return [
            'source_surface' => is_string($this->request->header('X-Titan-Source-Surface')) ? $this->request->header('X-Titan-Source-Surface') : null,
            'correlation_id' => is_string($this->request->header('X-Correlation-ID')) ? $this->request->header('X-Correlation-ID') : null,
        ];
    }
}
