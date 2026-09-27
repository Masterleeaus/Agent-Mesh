<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Services;

final class TitanAppsCoreReadinessValidator
{
    public function __construct(
        private readonly TitanAppsApplicationRegistry $applications,
        private readonly TitanAppsModuleLibrary $modules,
        private readonly TitanAppsRolePolicyService $roles,
    ) {}

    /** @return list<string> */
    public function errors(): array
    {
        return array_values(array_unique(array_merge(
            $this->applications->validate(),
            $this->roles->validate($this->modules->catalog()),
        )));
    }

    public function ready(): bool
    {
        return $this->errors() === [];
    }
}
