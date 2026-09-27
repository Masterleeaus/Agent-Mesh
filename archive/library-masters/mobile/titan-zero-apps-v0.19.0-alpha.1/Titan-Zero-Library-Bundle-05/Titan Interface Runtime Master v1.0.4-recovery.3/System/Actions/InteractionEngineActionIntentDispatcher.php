<?php
declare(strict_types=1);
namespace App\Extensions\TitanInterfaceRuntime\System\Actions;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\ActionIntentDispatcher;
use Illuminate\Contracts\Container\Container;

final class InteractionEngineActionIntentDispatcher implements ActionIntentDispatcher
{
    public function __construct(private readonly Container $app, private readonly UnavailableActionIntentDispatcher $fallback) {}

    public function dispatch(array $intent): array
    {
        $gateway='App\\Extensions\\InteractionEngine\\System\\Contracts\\CapabilityIntentGatewayInterface';
        if(!interface_exists($gateway)||!$this->app->bound($gateway)) return $this->fallback->dispatch($intent);
        if(($intent['type']??null)!=='capability-intent') throw new \InvalidArgumentException('Interface actions must be capability intents.');
        $capability=(string)($intent['capability']??'');
        $payload=is_array($intent['payload']??null)?$intent['payload']:[];
        $context=is_array($intent['context']??null)?$intent['context']:[];
        return (array)$this->app->make($gateway)->dispatch($capability,$payload,$context);
    }
}
