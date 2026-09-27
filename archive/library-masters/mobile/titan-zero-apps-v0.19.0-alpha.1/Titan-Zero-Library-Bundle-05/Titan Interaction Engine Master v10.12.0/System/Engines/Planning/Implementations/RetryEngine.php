<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Planning\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Planning\Contracts\RetryEngineInterface;

final class RetryEngine implements RetryEngineInterface
{
    private array $retryPolicy = [
        'max_attempts' => 3,
        'backoff' => 'exponential',
        'base_delay' => 1,
    ];
    private array $attempts = [];

    public function retryWithBackoff(string $taskId): void
    {
        $taskId = trim($taskId);
        if ($taskId === '') throw new \InvalidArgumentException('Retry task id cannot be empty.');
        $attempt = ($this->attempts[$taskId] ?? 0) + 1;
        $max = max(1, (int) ($this->retryPolicy['max_attempts'] ?? 3));
        if ($attempt > $max) throw new \RuntimeException("Retry limit exceeded for {$taskId}.");
        $this->attempts[$taskId] = $attempt;
        $base = max(0, (int) ($this->retryPolicy['base_delay'] ?? 1));
        $delay = ($this->retryPolicy['backoff'] ?? 'exponential') === 'exponential'
            ? $base * (2 ** ($attempt - 1))
            : $base * $attempt;
        $this->retryPolicy['last_retry'] = [
            'task_id' => $taskId,
            'attempt' => $attempt,
            'delay_seconds' => $delay,
            'scheduled_at' => gmdate(DATE_ATOM),
        ];
    }

    public function getRetryPolicy(): array
    {
        return $this->retryPolicy;
    }

    public function setRetryPolicy(array $policy): void
    {
        $merged = array_merge($this->retryPolicy, $policy);
        if ((int) ($merged['max_attempts'] ?? 0) < 1) throw new \InvalidArgumentException('max_attempts must be at least 1.');
        if ((int) ($merged['base_delay'] ?? -1) < 0) throw new \InvalidArgumentException('base_delay cannot be negative.');
        if (!in_array($merged['backoff'] ?? '', ['exponential', 'linear'], true)) throw new \InvalidArgumentException('Unsupported retry backoff policy.');
        $this->retryPolicy = $merged;
    }
}
