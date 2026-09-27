<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Health;

use App\Extensions\TitanAppsCore\System\Contracts\AppSurface;
use App\Extensions\TitanAppsCore\System\Services\TitanAppsApplicationRegistry;
use App\Extensions\TitanAppsCore\System\Services\TitanAppsCoreReadinessValidator;
use App\Extensions\TitanAppsCore\System\Services\TitanAppsLifecycleService;
use App\Extensions\TitanAppsCore\System\Services\TitanAppsPublicServiceRegistry;

final class TitanAppsCoreHealthService
{
    public function __construct(
        private readonly TitanAppsLifecycleService $lifecycle,
        private readonly TitanAppsPublicServiceRegistry $publicServices,
        private readonly TitanAppsApplicationRegistry $applications,
        private readonly TitanAppsCoreReadinessValidator $validator,
    ) {}

    /** @return array<string,mixed> */
    public function status(): array
    {
        $runtime = $this->lifecycle->readiness();
        $errors = $this->validator->errors();

        return [
            'extension'=>'titan-apps-core',
            'healthy'=>$errors === [],
            'surfaces'=>array_map(static fn(AppSurface $s): string => $s->value, AppSurface::cases()),
            'applications'=>$this->applications->catalogue(),
            'canonical_surfaces'=>['zero','go','hub'],
            'compatibility_aliases'=>[
                'bos'=>'zero','command'=>'zero','owner'=>'zero','manager'=>'zero','business'=>'zero',
                'field'=>'go','worker'=>'go','customer'=>'hub',
            ],
            'onboarding'=>['surface'=>'zero','journey'=>'onboarding'],
            'ownership_boundary_not_isolation'=>true,
            'platform_accessible_services'=>array_map(
                static fn($service): array => $service->toArray(),
                $this->publicServices->platformAccessible()
            ),
            'readiness_errors'=>$errors,
            'runtime'=>$runtime,
        ];
    }
}
