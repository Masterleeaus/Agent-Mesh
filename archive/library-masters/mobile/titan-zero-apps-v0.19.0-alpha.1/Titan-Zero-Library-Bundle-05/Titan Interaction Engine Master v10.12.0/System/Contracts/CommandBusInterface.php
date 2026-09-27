<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Contracts;

interface CommandBusInterface
{
    public function dispatch(string $capability, array $payload): void;
    public function registerHandler(string $capability, callable $handler): void;
    public function hasHandler(string $capability): bool;
}
