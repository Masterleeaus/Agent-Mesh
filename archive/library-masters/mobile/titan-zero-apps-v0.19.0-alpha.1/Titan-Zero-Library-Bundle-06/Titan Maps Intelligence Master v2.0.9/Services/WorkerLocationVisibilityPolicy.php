<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use Illuminate\Support\Facades\Gate;

/**
 * Distinguishes "the host defines this Gate" from "the current user is allowed".
 * When no host Gate exists, company-wide worker GPS visibility fails closed and callers self-limit.
 */
final class WorkerLocationVisibilityPolicy
{
    public const PERMISSION = 'titan-maps-intelligence.worker-location.read';

    public function canReadCompanyWide(string $companyId): bool
    {
        if (! Gate::has(self::PERMISSION)) return false;
        $user = auth()->user();
        if ($user === null) return false;
        return Gate::forUser($user)->allows(self::PERMISSION, [$companyId, ['scope'=>'worker-location']]);
    }
}
