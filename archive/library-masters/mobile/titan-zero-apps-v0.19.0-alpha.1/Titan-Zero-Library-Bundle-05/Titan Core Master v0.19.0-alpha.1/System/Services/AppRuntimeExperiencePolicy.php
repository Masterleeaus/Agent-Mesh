<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Services;

final class AppRuntimeExperiencePolicy
{
    /** @return array<string,mixed> */
    public function evaluate(bool $runtimeReady,bool $online,bool $offlineCapable): array
    {
        $state=match(true){
            $runtimeReady && $online => 'online',
            !$runtimeReady && $online => 'degraded',
            $runtimeReady && !$online && $offlineCapable => 'offline',
            default => 'unavailable',
        };

        return [
            'state'=>$state,
            'online'=>$online,
            'runtime_ready'=>$runtimeReady,
            'offline_capable'=>$offlineCapable,
            'allow_cached_presentation'=>in_array($state,['degraded','offline'],true),
            'allow_local_read_model'=>$state==='offline' && $offlineCapable,
            'queue_mutations_locally'=>false,
            'authority_increase'=>false,
        ];
    }
}
