<?php

declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Services;

use App\Extensions\TitanAppsCore\System\Contracts\AppLifecycle;

final class TitanAppsLifecycleService implements AppLifecycle
{
    public function __construct(
        private readonly TitanAppsDiscoveryService $apps,
        private readonly TitanAppsRuntimeDependencyRegistry $dependencies,
        private readonly TitanAppsPublicServiceRegistry $publicServices,
    ) {}

    /** @return array<string,mixed> */
    public function describe(): array
    {
        return [
            'suite'=>'Titan Apps',
            'surfaces'=>$this->apps->catalogue(),
            'runtime_dependencies'=>array_map(
                static fn($d)=>$d->toArray(),
                $this->dependencies->all()
            ),
            'offline_policy'=>(array) config('titan-apps-core.offline', []),
            'public_services'=>$this->publicServices->catalogue(),
        ];
    }

    /** @return array<string,mixed> */
    public function readiness(): array
    {
        $missing = $this->dependencies->missingRequired();
        return [
            'ready'=>$missing === [],
            'missing_required'=>$missing,
            'dependencies'=>$this->dependencies->readiness(),
            'surface_count'=>count($this->apps->applications()),
        ];
    }
}
