<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AdminPermissionAuthorizer;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Gate;

final class GateAdminPermissionAuthorizer implements AdminPermissionAuthorizer
{
    public function authorize(mixed $user, string $permission): void
    {
        if ($user === null) {
            throw new AuthenticationException('Authentication is required for Titan Maps Intelligence administration.');
        }

        if (Gate::has($permission)) {
            Gate::forUser($user)->authorize($permission);
            return;
        }

        if ((bool) config('extensions.titan_maps_intelligence.permissions.strict_host_gates', false)) {
            throw new AuthorizationException('Titan Maps Intelligence admin permission is not registered by the host: '.$permission);
        }

        // The route is already protected by Titan's host `admin` middleware. If the host later
        // registers the explicit Maps Gate ability, it becomes authoritative above.
    }
}
