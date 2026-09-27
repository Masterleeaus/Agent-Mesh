<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Implementations;

use App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts\FunctionCallingEngineInterface;
class FunctionCallingEngine implements FunctionCallingEngineInterface
{
    private array $functions = [];

    public function call(string $function, array $parameters): mixed
    {
        if (!isset($this->functions[$function])) {
            throw new \RuntimeException("Function '{$function}' not found");
        }
        return call_user_func($this->functions[$function], $parameters);
    }

    public function registerFunction(string $name, callable $function): void
    {
        $this->functions[$name] = $function;
    }

    public function listFunctions(): array
    {
        return array_keys($this->functions);
    }
}
