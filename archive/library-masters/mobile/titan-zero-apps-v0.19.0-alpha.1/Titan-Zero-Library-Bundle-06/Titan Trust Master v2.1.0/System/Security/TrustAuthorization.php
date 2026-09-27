<?php

declare(strict_types=1);

namespace App\Extensions\TitanTrust\System\Security;

use RuntimeException;
use Throwable;

final class TrustAuthorization
{
    public const REVIEW_VIEW = 'trust.compliance.review';
    public const COMPLIANCE_OVERRIDE = 'trust.compliance.override';
    public const INCIDENT_RESOLVE = 'trust.incident.resolve';
    public const RULE_MANAGE = 'trust.rules.manage';

    public static function assertActorPermission(mixed $actor, string $permission): void
    {
        if (! self::allows($actor, $permission)) {
            throw new RuntimeException("Titan Trust permission denied: {$permission}");
        }
    }

    public static function allows(mixed $actor, string $permission): bool
    {
        $permission = trim($permission);
        if (! is_object($actor) || $permission === '') return false;
        if (self::booleanMethod($actor, 'isSuperAdmin') === true) return true;
        foreach (['can', 'checkPermission', 'hasPermissionTo'] as $method) {
            if (self::permissionMethod($actor, $method, $permission) === true) return true;
        }
        return self::booleanMethod($actor, 'isAdmin') === true;
    }

    private static function booleanMethod(object $actor, string $method): ?bool
    {
        if (! method_exists($actor, $method)) return null;
        try { return $actor->{$method}() === true; } catch (Throwable) { return null; }
    }

    private static function permissionMethod(object $actor, string $method, string $permission): ?bool
    {
        if (! method_exists($actor, $method)) return null;
        try { return $actor->{$method}($permission) === true; } catch (Throwable) { return null; }
    }
}
