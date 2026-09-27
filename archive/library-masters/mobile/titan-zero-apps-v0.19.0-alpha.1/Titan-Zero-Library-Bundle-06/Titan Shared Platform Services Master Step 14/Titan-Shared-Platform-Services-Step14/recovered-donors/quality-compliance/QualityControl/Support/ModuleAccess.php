<?php

namespace Modules\QualityControl\Support;

use App\Models\User;

final class ModuleAccess
{
    public const MODULE_ALIASES = ['quality_control', 'inspections', 'inspection'];

    public static function userHasModule(?User $user = null): bool
    {
        $user ??= user();

        if (! $user) {
            return false;
        }

        $modules = $user->modules ?? user_modules();

        if (is_string($modules)) {
            $modules = array_filter(array_map('trim', explode(',', $modules)));
        }

        if ($modules instanceof \Illuminate\Support\Collection) {
            $modules = $modules->all();
        }

        if (! is_array($modules)) {
            return false;
        }

        return count(array_intersect(self::MODULE_ALIASES, $modules)) > 0;
    }

    public static function permissionLevel(string $permission, ?User $user = null): string
    {
        $user ??= user();

        if (! $user) {
            return 'none';
        }

        $level = $user->permission($permission);

        if ($level !== 'none') {
            return $level;
        }

        foreach (InspectionPermissions::aliasesFor($permission) as $legacy) {
            try {
                $legacyLevel = $user->permission($legacy);
            } catch (\Throwable) {
                $legacyLevel = 'none';
            }

            if ($legacyLevel !== 'none') {
                return $legacyLevel;
            }

            if (method_exists($user, 'hasPermissionTo') && $user->hasPermissionTo($legacy)) {
                return 'all';
            }
        }

        return $level;
    }

    public static function can(string $permission, array $allowed = ['all'], ?User $user = null): bool
    {
        return in_array(self::permissionLevel($permission, $user), $allowed, true);
    }
}
