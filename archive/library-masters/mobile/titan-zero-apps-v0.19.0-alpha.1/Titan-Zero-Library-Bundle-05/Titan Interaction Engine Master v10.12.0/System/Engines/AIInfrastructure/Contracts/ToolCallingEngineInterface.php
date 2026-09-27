<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts;

interface ToolCallingEngineInterface
{
    public function call(string $tool, array $parameters): mixed;
    public function registerTool(string $name, callable $tool): void;
    public function listTools(): array;
}
