<?php

namespace Modules\QualityControl\Policies;

use App\Models\User;
use Modules\QualityControl\Support\InspectionPermissions;
use Modules\QualityControl\Support\ModuleAccess;

class InspectionPolicy
{
    public function viewAny(User $user): bool
    {
        return ModuleAccess::can(InspectionPermissions::VIEW, ['all'], $user);
    }

    public function create(User $user): bool
    {
        return ModuleAccess::can(InspectionPermissions::CREATE, ['all'], $user);
    }
}
