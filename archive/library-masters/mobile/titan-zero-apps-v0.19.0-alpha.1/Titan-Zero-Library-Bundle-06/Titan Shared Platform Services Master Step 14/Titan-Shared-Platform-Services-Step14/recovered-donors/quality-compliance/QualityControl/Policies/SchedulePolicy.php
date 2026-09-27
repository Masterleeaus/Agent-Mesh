<?php

namespace Modules\QualityControl\Policies;

use App\Models\User;
use Modules\QualityControl\Support\InspectionPermissions;
use Modules\QualityControl\Support\ModuleAccess;

class SchedulePolicy
{
    public function viewAny(User $user): bool
    {
        return ModuleAccess::can(InspectionPermissions::VIEW, ['all'], $user);
    }
}
