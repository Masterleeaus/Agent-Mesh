<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Services;

final class TitanAppsHostDiagnosticsService
{
    public function __construct(
        private readonly TitanAppsApplicationRegistry $applications,
        private readonly TitanAppsRuntimeDependencyRegistry $dependencies,
        private readonly TitanAppsPublicServiceRegistry $publicServices,
        private readonly TitanAppsCoreReadinessValidator $validator,
    ) {}

    /** @return array<string,mixed> */
    public function inspect(): array
    {
        $runtime = $this->dependencies->readiness();
        $errors = $this->validator->errors();

        return [
            'suite'=>'Titan Apps',
            'owner'=>'Titan Apps: Core',
            'ownership_boundary_not_isolation'=>true,
            'applications'=>$this->applications->catalogue(),
            'runtime_dependencies'=>$runtime,
            'platform_accessible_services'=>$this->publicServices->catalogue(),
            'ready'=>$errors === [] && $this->dependencies->missingRequired() === [],
            'errors'=>$errors,
            'missing_required_runtime'=>$this->dependencies->missingRequired(),
            'package_path_is_authority'=>false,
        ];
    }
}
