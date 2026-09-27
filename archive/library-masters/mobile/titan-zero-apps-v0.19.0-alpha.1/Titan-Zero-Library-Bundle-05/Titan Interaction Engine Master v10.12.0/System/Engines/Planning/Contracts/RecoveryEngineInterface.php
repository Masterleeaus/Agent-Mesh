<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Planning\Contracts;

interface RecoveryEngineInterface
{
    public function recover(string $failureId): bool;
    public function getFailureLog(): array;
    public function retry(string $taskId): bool;
}
