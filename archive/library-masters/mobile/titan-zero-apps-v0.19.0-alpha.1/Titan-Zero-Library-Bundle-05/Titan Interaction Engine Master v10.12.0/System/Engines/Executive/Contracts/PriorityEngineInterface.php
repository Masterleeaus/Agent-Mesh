<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Executive\Contracts;

interface PriorityEngineInterface
{
    public function rank(array $items, array $context = []): array;
    public function getHighestPriority(array $items, array $context = []): ?array;
    public function setPriority(string $item, int $priority): void;
}
