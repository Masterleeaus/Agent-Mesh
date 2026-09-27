<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts;

interface ModelSelectionEngineInterface
{
    public function select(array $requirements): string;
    public function getAvailableModels(): array;
    public function getModelCapabilities(string $model): array;
}
