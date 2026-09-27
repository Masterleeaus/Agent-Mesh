<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Host;

/**
 * MagicAI/Titan host authorization compatibility.
 * Super Admin is the only unconditional bypass. Delegated Admin remains permission-bounded.
 */
final class TitanHostAuthorizationAdapter
{
    /** @param list<string> $delegatedAdminPermissions */
    public function allows(object $user, string $permission, array $delegatedAdminPermissions = []): bool
    {
        if ($permission === '') return false;
        if ($this->callBool($user, 'isSuperAdmin')) return true; // Super Admin bypass

        foreach (['can', 'checkPermission', 'hasPermissionTo'] as $method) {
            if (! method_exists($user, $method)) continue;
            try {
                if ((bool) $user->{$method}($permission)) return true;
            } catch (\Throwable) {
                // Fall through to the next compatible host authorization method.
            }
        }

        if ($this->callBool($user, 'isAdmin')) {
            return in_array($permission, $delegatedAdminPermissions, true);
        }

        return false;
    }

    /** @return list<string> */
    public function capabilities(object $user): array
    {
        if ($this->callBool($user, 'isSuperAdmin')) return ['*'];

        $out = [];
        try {
            if (method_exists($user, 'getAllPermissions')) {
                $permissions = $user->getAllPermissions();
                if (is_object($permissions) && method_exists($permissions, 'pluck')) {
                    foreach ((array) $permissions->pluck('name')->all() as $permission) if (is_string($permission) && $permission !== '') $out[$permission] = true;
                }
            }
            if (method_exists($user, 'getPermissionNames')) {
                $permissions = $user->getPermissionNames();
                $values = is_object($permissions) && method_exists($permissions, 'all') ? $permissions->all() : (array) $permissions;
                foreach ($values as $permission) if (is_string($permission) && $permission !== '') $out[$permission] = true;
            }
        } catch (\Throwable) {
            // Capability enumeration is advisory; per-permission allows() remains the host-compatible authority check.
        }

        return array_keys($out);
    }

    public function isSuperAdmin(object $user): bool { return $this->callBool($user, 'isSuperAdmin'); }
    public function isAdmin(object $user): bool { return $this->callBool($user, 'isAdmin'); }

    private function callBool(object $user, string $method): bool
    {
        if (! method_exists($user, $method)) return false;
        try { return (bool) $user->{$method}(); } catch (\Throwable) { return false; }
    }
}
