<?php

namespace Modules\QualityControl\Policies;

use App\Models\User;
use Modules\QualityControl\Support\InspectionPermissions;
use Modules\QualityControl\Support\ModuleAccess;

class TemplatePolicy
{
    public function viewAny(User $user): bool
    {
        return ModuleAccess::can(InspectionPermissions::VIEW, ['all'], $user)
            || ModuleAccess::can(InspectionPermissions::MANAGE_TEMPLATES, ['all'], $user);
    }

    public function view(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return ModuleAccess::can(InspectionPermissions::MANAGE_TEMPLATES, ['all'], $user);
    }

    public function update(User $user): bool
    {
        return ModuleAccess::can(InspectionPermissions::MANAGE_TEMPLATES, ['all'], $user);
    }

    public function delete(User $user): bool
    {
        return ModuleAccess::can(InspectionPermissions::MANAGE_TEMPLATES, ['all'], $user);
    }
}
