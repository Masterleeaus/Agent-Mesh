<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts;

interface VectorSearchEngineInterface
{
    public function search(array $vector, int $k): array;
    public function index(string $id, array $vector): void;
    public function delete(string $id): void;
}
