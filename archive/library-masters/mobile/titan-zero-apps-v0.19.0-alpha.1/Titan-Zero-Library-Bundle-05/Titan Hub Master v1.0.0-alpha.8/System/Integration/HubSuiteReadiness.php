<?php

declare(strict_types=1);

namespace App\Extensions\TitanHub\System\Integration;

use Illuminate\Contracts\Foundation\Application;

/** Reports live wiring against public Titan Apps Suite contracts only. */
final class HubSuiteReadiness
{
    public function __construct(private Application $app) {}

    /** @return array<string,mixed> */
    public function report(): array
    {
        $core=$this->core();
        $interaction=$this->contracts([
            'public' => 'App\\Extensions\\InteractionEngine\\System\\Contracts\\PublicInteractionEngineInterface',
            'capability_intents' => 'App\\Extensions\\InteractionEngine\\System\\Contracts\\CapabilityIntentGatewayInterface',
        ]);
        $interface=$this->contracts([
            'runtime' => 'App\\Extensions\\TitanInterfaceRuntime\\System\\Contracts\\InterfaceRuntime',
        ]);
        $builder=$this->contracts([
            'components' => 'App\\Extensions\\TitanBuilder\\System\\Contracts\\ComponentRegistry',
            'templates' => 'App\\Extensions\\TitanBuilder\\System\\Contracts\\TemplateRegistry',
            'surfaces' => 'App\\Extensions\\TitanBuilder\\System\\Contracts\\SurfaceRegistry',
        ]);
        $visual=$this->contracts([
            'runtime' => 'App\\Extensions\\TitanVisualRuntime\\System\\Contracts\\VisualRuntime',
        ]);
        $ready=($core['hub_registered']??false)===true
            && ($interaction['ready']??false)===true
            && ($interface['ready']??false)===true
            && ($builder['ready']??false)===true
            && ($visual['ready']??false)===true;

        return [
            'surface'=>'hub',
            'ready'=>$ready,
            'core'=>$core,
            'interaction_engine'=>$interaction,
            'interface_runtime'=>$interface,
            'builder'=>$builder,
            'visual_runtime'=>$visual,
        ];
    }


    /** @return array<string,mixed> */
    private function core(): array
    {
        $registryClass = 'App\\Extensions\\TitanAppsCore\\System\\Services\\TitanAppsApplicationRegistry';
        $surfaceClass = 'App\\Extensions\\TitanAppsCore\\System\\Contracts\\AppSurface';
        $bound = class_exists($registryClass) && $this->app->bound($registryClass);
        $registered = false;
        $app = null;
        if ($bound && enum_exists($surfaceClass)) {
            try {
                /** @var mixed $surface */
                $surface = constant($surfaceClass.'::Hub'); // AppSurface::Hub canonical identity
                $descriptor = $this->app->make($registryClass)->get($surface);
                $app = $descriptor->toArray();
                $registered = ($app['surface'] ?? null) === 'hub';
            } catch (\Throwable) {
                $registered = false;
            }
        }
        return ['bound' => $bound, 'hub_registered' => $registered, 'registration' => $app];
    }

    /** @param array<string,string> $contracts @return array<string,mixed> */
    private function contracts(array $contracts): array
    {
        $out = [];
        foreach ($contracts as $name => $contract) {
            $out[$name] = [
                'contract' => $contract,
                'available' => (interface_exists($contract) || class_exists($contract)) && $this->app->bound($contract),
            ];
        }
        $out['ready'] = !array_filter($out, static fn($row, $key) => $key !== 'ready' && is_array($row) && $row['available'] !== true, ARRAY_FILTER_USE_BOTH);
        return $out;
    }
}
