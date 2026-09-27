<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts;

interface FunctionCallingEngineInterface
{
    public function call(string $function, array $parameters): mixed;
    public function registerFunction(string $name, callable $function): void;
    public function listFunctions(): array;
}
