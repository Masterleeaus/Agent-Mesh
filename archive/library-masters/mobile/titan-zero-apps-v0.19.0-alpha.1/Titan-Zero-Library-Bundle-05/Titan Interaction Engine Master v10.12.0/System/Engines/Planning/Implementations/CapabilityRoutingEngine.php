<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Planning\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Planning\Contracts\CapabilityRoutingEngineInterface;
class CapabilityRoutingEngine implements CapabilityRoutingEngineInterface
{
    private array $handlers = [];

    public function route(string $capability, array $payload): mixed
    {
        if (!isset($this->handlers[$capability])) {
            throw new \RuntimeException("No handler for capability '{$capability}'");
        }
        return call_user_func($this->handlers[$capability], $payload);
    }

    public function registerHandler(string $capability, callable $handler): void
    {
        $this->handlers[$capability] = $handler;
    }

    public function listCapabilities(): array
    {
        return array_keys($this->handlers);
    }
}
