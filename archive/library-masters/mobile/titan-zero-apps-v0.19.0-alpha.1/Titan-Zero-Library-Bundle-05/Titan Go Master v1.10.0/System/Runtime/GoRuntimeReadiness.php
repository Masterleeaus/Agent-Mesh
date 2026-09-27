<?php

declare(strict_types=1);

namespace App\Extensions\TitanGo\System\Runtime;

use App\Extensions\TitanGo\System\Contracts\GoActionIntentGatewayInterface;
use App\Extensions\TitanGo\System\Contracts\GoOfflineQueueInterface;
use App\Extensions\TitanGo\System\Contracts\GoProjectionProviderInterface;
use App\Extensions\TitanGo\System\Contracts\GoSuiteRuntimeInterface;
use Illuminate\Contracts\Container\Container;

final class GoRuntimeReadiness
{
    public function __construct(private Container $container) {}

    public function report(): array
    {
        $required = [
            'projection_provider' => GoProjectionProviderInterface::class,
            'action_intent_gateway' => GoActionIntentGatewayInterface::class,
            'offline_queue' => GoOfflineQueueInterface::class,
        ];

        $bindings = [];
        $hostReady = true;
        foreach ($required as $name => $contract) {
            $bound = $this->container->bound($contract);
            $bindings[$name] = ['contract' => $contract, 'bound' => $bound];
            $hostReady = $hostReady && $bound;
        }

        if (!$this->container->bound(GoSuiteRuntimeInterface::class)) {
            $suite = [
                'ready' => false,
                'mode' => 'degraded-shell',
                'reason' => 'go_suite_runtime_unbound',
                'company_boundary' => 'company_id',
            ];
        } else {
            /** @var GoSuiteRuntimeInterface $suiteRuntime */
            $suiteRuntime = $this->container->make(GoSuiteRuntimeInterface::class);
            $suite = $suiteRuntime->diagnostics();
        }
        $ready = $hostReady && ($suite['ready'] ?? false) === true;

        return [
            'ready' => $ready,
            'mode' => $ready ? 'full' : 'degraded-shell',
            'company_boundary' => 'company_id',
            'host_bindings' => $bindings,
            'suite' => $suite,
        ];
    }
}
