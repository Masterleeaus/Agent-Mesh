<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Gate;

final class GatePermissionAuthorizer implements PermissionAuthorizer
{
    private const MUTATING_SUFFIXES = [
        '.create','.cancel','.export','.classify','.approve','.reject','.promote','.manage','.analyse','.write',
        '.calculate','.find','.recommend','.evaluate','.start','.decide','.geocode','.override','.update',
    ];
    public function authorize(string $userId, string $companyId, string $permission, array $context = []): void
    {
        $user = auth()->user();
        if ($user === null) {
            throw new AuthenticationException('Authentication is required for Titan Maps Intelligence.');
        }

        $authenticatedId = method_exists($user, 'getAuthIdentifier') ? (string) $user->getAuthIdentifier() : (string) ($user->id ?? '');
        if ($authenticatedId === '' || ! hash_equals($authenticatedId, $userId)) {
            throw new AuthenticationException('The authenticated user does not match the authorised Maps context.');
        }

        $strict = (bool) config('extensions.titan_maps_intelligence.permissions.strict_host_gates', false);
        if (Gate::has($permission)) {
            Gate::forUser($user)->authorize($permission, [$companyId, $context]);
            return;
        }

        if ($strict || $this->requiresRegisteredGate($permission)) {
            $message = $strict
                ? 'Titan Maps Intelligence permission is not registered by the host: '.$permission
                : 'MAPS_PERMISSION_UNREGISTERED_MUTATION: Unregistered Maps mutation permission fails closed: '.$permission;
            throw new AuthorizationException($message);
        }

        // Host-portable read baseline: auth + AuthorisedCompanyContext remains the tenant boundary.
        // Consequential permissions never inherit this fallback; they require an explicit host Gate/adapter.
    }

    private function requiresRegisteredGate(string $permission): bool
    {
        foreach (self::MUTATING_SUFFIXES as $suffix) {
            if (str_ends_with($permission, $suffix)) return true;
        }
        // Unknown future non-read permissions fail closed by default.
        return ! str_ends_with($permission, '.read');
    }
}
