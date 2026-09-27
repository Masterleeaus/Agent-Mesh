<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts;

interface RetrievalEngineInterface
{
    public function retrieve(string $query, array $source): array;
    public function reRank(array $results): array;
    public function getTopK(string $query, int $k): array;
}
