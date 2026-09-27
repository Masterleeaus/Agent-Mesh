<?php

declare(strict_types=1);

namespace App\Extensions\TitanGo\System\Health;

use App\Extensions\TitanGo\System\Contracts\GoRuntimeBridgeInterface;
use App\Extensions\TitanGo\System\Runtime\GoRuntimeReadiness;

final class GoHealthCheck
{
    public function __construct(private GoRuntimeBridgeInterface $bridge, private GoRuntimeReadiness $readiness) {}

    public function report(): array
    {
        $runtime = $this->readiness->report();
        return [
            'status' => $runtime['ready'] ? 'healthy' : 'degraded',
            'surface' => $this->bridge->appSurface(),
            'mode' => $runtime['mode'],
            'runtime' => $runtime,
            'dependencies' => [
                'core' => 'required',
                'interaction-engine' => 'required',
                'interface-runtime' => 'required',
                'visual-runtime' => 'required',
                'builder' => 'optional',
                'titan-field' => 'required',
            ],
            'degraded_offline' => true,
        ];
    }
}
