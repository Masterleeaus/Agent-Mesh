<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Services;

use App\Extensions\TitanAppsCore\System\Contracts\AppPwaLifecycle;
use App\Extensions\TitanAppsCore\System\Contracts\AppSurface;

final class TitanAppsPwaLifecycleService implements AppPwaLifecycle
{
    public function __construct(private readonly TitanAppsApplicationRegistry $apps) {}

    /** @return array<string,mixed> */
    public function policy(AppSurface $surface): array
    {
        $app = $this->apps->get($surface)->toArray();

        return [
            'surface'=>$surface->value,
            'app_id'=>$app['app_id'],
            'installable'=>(bool) $app['pwa'],
            'offline_capable'=>(bool) $app['offline_capable'],
            'service_worker_authority'=>'host/shared PWA runtime',
            'local_store_authority'=>'Titan Apps shared device/offline implementation',
            'interface_mount'=>$app['interface_mount'],
            'queue_contract'=>'OfflineCapabilityIntent',
            'queue_persistence_owned_here'=>false,
            'update_policy'=>'versioned-host-controlled',
        ];
    }
}
