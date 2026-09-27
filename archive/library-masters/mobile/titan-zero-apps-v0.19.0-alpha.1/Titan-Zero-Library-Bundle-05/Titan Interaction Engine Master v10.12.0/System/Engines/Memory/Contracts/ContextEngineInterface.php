<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Memory\Contracts;

interface ContextEngineInterface
{
    public function build(int $userId, array $state): array;
    public function getContext(int $userId): array;
    public function updateContext(int $userId, array $data): void;
    public function clearContext(int $userId): void;
}
