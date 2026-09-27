<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Planning\Contracts;

interface RetryEngineInterface
{
    public function retryWithBackoff(string $taskId): void;
    public function getRetryPolicy(): array;
    public function setRetryPolicy(array $policy): void;
}
