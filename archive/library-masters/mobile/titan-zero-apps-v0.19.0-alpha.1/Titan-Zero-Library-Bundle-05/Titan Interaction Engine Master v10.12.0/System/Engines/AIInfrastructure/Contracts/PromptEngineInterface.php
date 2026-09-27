<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts;

interface PromptEngineInterface
{
    public function build(array $components): string;
    public function optimize(string $prompt): string;
    public function getPromptTemplates(): array;
}
